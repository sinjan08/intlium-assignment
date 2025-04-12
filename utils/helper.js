exports.respond = (res, success = true, statusCode = 200, message = '', data = [], metadata = []) => {
    const response = {
        success: success,
        message: message,
    };

    if (!success) {
        response.error = statusCode;
    } else {
        response.data = data;
    }

    if (metadata && metadata.length > 0) {
        response.metadata = metadata;
    }

    return res.status(statusCode).json(response);
}