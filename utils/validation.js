const serverCheckUserIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("email") ||
    !reqBody.email === "string" ||
    reqBody.email < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("password") ||
    !reqBody.password === "string" ||
    reqBody.password < 1
  ) {
    return false;
  }
  return true;
};

const serverCheckEmailIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("email") ||
    !reqBody.email === "string" ||
    reqBody.email < 1
  ) {
    return false;
  }
  return true;
};

module.exports = { serverCheckUserIsValid, serverCheckEmailIsValid };
