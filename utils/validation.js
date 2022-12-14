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

const serverCheckPasswordIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("password") ||
    !reqBody.password === "string" ||
    reqBody.password < 1
  ) {
    return false;
  }
  return true;
};

const serverCheckProgramInfoIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("programName") ||
    !reqBody.programName === "string" ||
    reqBody.programName < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("photo") ||
    !reqBody.photo === "string" ||
    reqBody.photo < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("startDate") ||
    !reqBody.startDate === "string" ||
    reqBody.startDate < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("endDate") ||
    !reqBody.endDate === "string" ||
    reqBody.endDate < 1
  ) {
    return false;
  }
  if (!reqBody.hasOwnProperty("isActive") || !reqBody.isActive === "boolean") {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("weeklyPracticeObj") ||
    !reqBody.weeklyPracticeObj === "object" ||
    Object.keys(reqBody.weeklyPracticeObj) < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("programDaysObj") ||
    !reqBody.programDaysObj === "object" ||
    Object.keys(reqBody.programDaysObj) < 1
  ) {
    return false;
  }
  return true;
};

const serverCheckCoachInfoIsValid = (reqBody) => {
  if (
    !reqBody.hasOwnProperty("firstName") ||
    !reqBody.firstName === "string" ||
    reqBody.firstName < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("lastName") ||
    !reqBody.lastName === "string" ||
    reqBody.lastName < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("telephone") ||
    !reqBody.telephone === "string" ||
    reqBody.telephone < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("addressOne") ||
    !reqBody.addressOne === "string" ||
    reqBody.addressOne < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("addressTwo") ||
    !reqBody.addressTwo === "string"
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("city") ||
    !reqBody.city === "string" ||
    reqBody.city < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("zipCode") ||
    !reqBody.zipCode === "string" ||
    reqBody.zipCode < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("about") ||
    !reqBody.about === "string" ||
    reqBody.about < 1
  ) {
    return false;
  }
  if (
    !reqBody.hasOwnProperty("photo") ||
    !reqBody.photo === "string" ||
    reqBody.photo < 1
  ) {
    return false;
  }
  return true;
};

module.exports = {
  serverCheckUserIsValid,
  serverCheckEmailIsValid,
  serverCheckPasswordIsValid,
  serverCheckCoachInfoIsValid,
  serverCheckProgramInfoIsValid,
};
