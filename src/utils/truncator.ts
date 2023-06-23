const truncator = (long: string) => {
  if (long.length > 60) {
    const start = long.substring(0, 28);
    const end = long.substr(long.length - 28);

    return `${start}...${end}`;
  }

  return long;
};

export default truncator;
