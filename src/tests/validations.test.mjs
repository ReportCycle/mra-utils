import express, { json } from 'express';
import { body, query } from 'express-validator';
import request from 'supertest';
import { checkJSONBody, checkRequestValidity, isValidEmail, isValidUrl, testUrlAccessibility} from '../utils/validations.mjs';

describe('Test validation functions', () => {

    describe('testUrlAccessibility', () => {
        test('testUrlAccessibility returns true for an accessible URL', async () => {
            await expect(testUrlAccessibility('https://www.example.com')).resolves.toBeTruthy();
        });

        // This test might be less reliable as it depends on an external service being down
        test('testUrlAccessibility returns false for an inaccessible URL', async () => {
            await expect(testUrlAccessibility('https://thisurldoesnotexist1234.com')).resolves.toBeFalsy();
        });
    });

    describe('isValidUrl', () => {
        test('should return true for a valid URL', () => {
            expect(isValidUrl('https://www.example.com')).toBeTruthy();
        });

        test('should return false for an invalid URL', () => {
            expect(isValidUrl('not a url')).toBeFalsy();
        });
    });

    describe('isValidEmail', () => {
        test('should return true for a valid email', () => {
            expect(isValidEmail('test@example.com')).toBe(true);
        });

        test('should return true for a valid email with numbers and symbols', () => {
            expect(isValidEmail('user.name+123@example.co.uk')).toBe(true);
        });

        test('should return true for a valid email with subdomains', () => {
            expect(isValidEmail('user@sub.domain.example.com')).toBe(true);
        });

        test('should return false for an email without "@" symbol', () => {
            expect(isValidEmail('invalidEmail.com')).toBe(false);
        });

        test('should return false for an email without domain', () => {
            expect(isValidEmail('user@')).toBe(false);
        });

        test('should return false for an email without local part', () => {
            expect(isValidEmail('@example.com')).toBe(false);
        });

        test('should return false for an email without a top-level domain', () => {
            expect(isValidEmail('user@example')).toBe(false);
        });

        test('should return false for an email with invalid characters', () => {
            expect(isValidEmail('user@exa$mple.com')).toBe(false);
        });

        test('should return false for an email with spaces', () => {
            expect(isValidEmail('user @example.com')).toBe(false);
        });

        test('should return false for an email with consecutive dots in domain', () => {
            expect(isValidEmail('user@example..com')).toBe(false);
        });

        test('should return false for an email with special characters in domain', () => {
            expect(isValidEmail('user@exa*mple.com')).toBe(false);
        });

        test('should return false for an email with multiple "@" symbols', () => {
            expect(isValidEmail('user@@example.com')).toBe(false);
        });
    });

    describe('checkJSONBody', () => {
        let app;

        beforeEach(() => {
            app = express();

            // Built-in middleware for parsing JSON and URL-encoded bodies
            app.use(json());

            // Add the middleware to handle JSON body errors
            app.use(checkJSONBody);

            // Dummy route for testing
            app.post('/test', (_, res) => {
                res.status(200).json({ message: 'Success' });
            });
        });

        test('should return 400 with proper error details for invalid JSON', async () => {
            const response = await request(app)
                .post('/test')
                .set('Content-Type', 'application/json')
                .send("{ invalidJSON: 'true' }"); // Invalid JSON without quotes around the key

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                message: 'Invalid JSON format.',
                details: {
                    type: 'entity.parse.failed',
                    error: expect.any(String),
                    position: '2',
                    hint: 'Ensure that all keys and values are properly enclosed in double quotes.'
                }
            });
        });

        test('should call next middleware for valid JSON', async () => {
            const response = await request(app)
                .post('/test')
                .set('Content-Type', 'application/json')
                .send({ validJSON: true });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Success' });
        });

        test('should call next middleware when no JSON syntax error occurs', async () => {
            const nextSpy = jest.fn();  // Create a spy for next()

            // Add a new route that uses the middleware and passes valid JSON
            app.post('/testNext', (req, res, next) => {
                checkJSONBody(null, req, res, nextSpy); // Call the middleware without an error
                next();  // Proceed to the next middleware or route handler
            }, (_, res) => {
                res.status(200).json({ message: 'Next middleware called' });
            });

            // Trigger the route
            const response = await request(app)
                .post('/testNext')
                .set('Content-Type', 'application/json')
                .send({ validJSON: true });

            expect(nextSpy).toHaveBeenCalled();  // Ensure next() was called
            expect(response.status).toBe(200);  // Check that the response reaches the next route
            expect(response.body).toEqual({ message: 'Next middleware called' });
        });

    });

    describe('checkRequestValidity', () => {
        let app;

        beforeEach(() => {
            app = express();

            // Middleware to parse JSON bodies
            app.use(json());

            // Sample route with validation rules
            app.post('/btest',
                // Validation rules using express-validator
                body('email').isEmail().withMessage('Invalid email format.'),
                body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
                checkRequestValidity, // Middleware to check validation results
                (_, res) => {
                    res.status(200).json({ message: 'Valid request' });
                }
            );

            // Sample route with query validation rules
            app.get('/qtest',
                // Validation rules for query parameters using express-validator
                query('age').isInt({ min: 1 }).withMessage('Age must be a positive integer.'),
                query('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long.'),
                checkRequestValidity, // Middleware to check validation results
                (_, res) => {
                    res.status(200).json({ message: 'Valid query parameters' });
                }
            );
        });

        test('should return 400 with validation errors for invalid input', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({ email: 'invalid-email', password: '123' }); // Invalid email and short password

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                errors: [
                    { msg: 'Invalid email format.', path: 'email', location: 'body', type: 'field', value: 'invalid-email' },
                    { msg: 'Password must be at least 6 characters long.', path: 'password', type: 'field', location: 'body', value: '123' }
                ]
            });
        });

        // Body validation tests for /btest
        test('should call next middleware for valid input', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({ email: 'test@example.com', password: '123456' }); // Valid email and password

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Valid request' });
        });

        test('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/btest')
                .set('Content-Type', 'application/json')
                .send({}); // Missing both email and password

            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBe(2); // Expecting two validation errors
        });

        // Query validation tests for /qtest
        test('should return 400 with validation errors for invalid query input', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({ age: -5, name: 'A' }); // Invalid age and short name

            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                errors: [
                    { msg: 'Age must be a positive integer.', path: 'age', type: 'field', location: 'query', value: '-5' },
                    { msg: 'Name must be at least 2 characters long.', path: 'name', type: 'field', location: 'query', value: 'A' }
                ]
            });
        });

        test('should return 200 for valid query input', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({ age: 30, name: 'John' }); // Valid age and name

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Valid query parameters' });
        });

        test('should return 400 for missing query parameters', async () => {
            const response = await request(app)
                .get('/qtest')
                .set('Content-Type', 'application/json')
                .query({}); // Missing both age and name query parameters

            expect(response.status).toBe(400);
            expect(response.body.errors.length).toBe(2); // Expecting two validation errors
        });
    });

});
