class ApiResponse {
  static success(res, statusCode = 200, data = null, message = 'Success') {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, statusCode = 500, message = 'Error') {
    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
}

module.exports = ApiResponse;
