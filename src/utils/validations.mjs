import axios from 'axios';
import { validationResult } from 'express-validator';
import { Agent } from 'https';

/**
 * Tests if a given URL is accessible by making a HEAD request.
 *
 * @async
 * @param {string} url - The URL to test for accessibility.
 * @returns {Promise<boolean>} True if the URL is accessible, false otherwise.
 */
export const testUrlAccessibility = async function (url) {
    try {
        // Create a new instance of the HTTPS agent with keepAlive set to false
        const httpsAgent = new Agent({ keepAlive: false });
        // Use axios to make a HEAD request to the URL
        await axios.head(url, { httpsAgent });
        return true; // URL is accessible
    } catch (err) {
        return false; // URL is not accessible
    }
};

/**
 * Validates whether the given input is a well-formed URL.
 *
 * @param {string} inputUrl - The URL to validate.
 * @returns {boolean} True if the input is a valid URL, false otherwise.
 */
export const isValidUrl = (inputUrl) => {
    try {
        const _ = new URL(inputUrl);
        return true;
    } catch (err) {
        return false;
    }
};

/**
 * Function to validate an email address format.
 * It uses a regular expression to check if the email follows the standard email format.
 *
 * @param {string} email - The email address to validate.
 * @returns {boolean} - Returns true if the email is valid, otherwise false.
 *
 * @example
 * isValidEmail('test@example.com'); // true
 * isValidEmail('invalid-email'); // false
 */
export const isValidEmail = (email) => {
    // Improved regular expression for more robust email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?$/;

    // Check if email contains consecutive dots in the domain part
    if (/\.\./.test(email.split('@')[1])) {
        return false;
    }

    return emailRegex.test(email);
};

/**
 * Middleware to validate request data using validationResult.
 * It checks if the request meets the validation criteria set by previous validation middlewares.
 * If the validation fails, it sends a 400 status code with the validation errors.
 * Otherwise, it passes control to the next middleware function in the stack.
 *
 * @param {object} req - The request object from Express.js containing the client's request data.
 * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
 * @param {function} next - The callback function to pass control to the next middleware function.
 */
export const checkRequestValidity = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * Middleware to handle and respond to invalid JSON format errors.
 * This middleware captures `SyntaxError` thrown by the `express.json()` middleware
 * when the incoming request contains invalid JSON. It extracts useful information
 * about the error, including the error type, message, and position where the error
 * occurred in the JSON string, and sends a detailed response back to the client.
 *
 * @param {object} err - The error object thrown by `express.json()` when it encounters malformed JSON.
 * @param {object} req - The request object from Express.js containing the client's request data.
 * @param {object} res - The response object from Express.js used to send back the desired HTTP response.
 * @param {function} next - The callback function to pass control to the next middleware function.
 *
 * @returns {void|object} - Sends a 400 error response with details if the error is a `SyntaxError`.
 *                          Otherwise, passes control to the next middleware.
 *
 * @example
 * // Usage as part of the Express middleware stack:
 * app.use(express.json());
 * app.use(checkJSONBody);
 */
export const checkJSONBody = (err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        // Extract relevant details from the error message
        const position = err.message.match(/position (\d+)/)?.[1] || 'Unknown';
        const errorSnippet = err.message.split('\n')[0]; // Get first line of the error

        return res.status(400).json({
            message: 'Invalid JSON format.',
            details: {
                type: err.type,
                error: errorSnippet,  // Include the main error message
                position: position,  // Provide position of the error in the JSON string
                hint: 'Ensure that all keys and values are properly enclosed in double quotes.'
            }
        });
    }
    // Pass the error to the next error-handling middleware, if any
    next(err);
};
