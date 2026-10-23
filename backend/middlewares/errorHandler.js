const errorHandler = (err, _req, res, _next) => {
    console.error('Terjadi Kesalahan Global:', err.stack);

    // Format standar balasan error untuk frontend
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Terjadi kesalahan pada server internal Zifa Laundry.',
    });
};

module.exports = errorHandler;