const successResponse = (
  res,
  statusCode,
  enMessage,
  arMessage,
  data = null,
  token = null
) => {
  return res.status(statusCode).json({
    success: true,
    message: {
      en: enMessage,
      ar: arMessage,
    },
    data,
    ...(token && { token }), // only include if token exists
  });
};

module.exports = {
  successResponse,
};
