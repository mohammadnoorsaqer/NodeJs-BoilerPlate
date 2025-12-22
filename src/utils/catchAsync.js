// the function takes the controller function as an argument fn
//also the controller function parameters which are req,res,next
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = catchAsync;
