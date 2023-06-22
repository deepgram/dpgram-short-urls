const randomString = (length = 7) => {
  return Math.random().toString(16).substr(2, length);
};

export default randomString;
