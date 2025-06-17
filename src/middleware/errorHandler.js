const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            error: messages
        });
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            error: 'Resource not found'
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
};

module.exports = errorHandler;
