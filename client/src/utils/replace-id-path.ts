export const replaceIdPath = (baseHref: string, searchValue: string, id: string | number) => {
  const idToString: string = typeof id === 'number' ? id.toString() : id;
  return baseHref.replace(searchValue, idToString);
};
