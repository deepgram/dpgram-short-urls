const isValidUrl = (url: string) => {
  try {
    return Boolean(new URL(url));
  } catch (err) {
    return false;
  }
};

export default isValidUrl;
