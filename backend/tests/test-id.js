let currentId = 1;

export function nextTestId() {
  const id = currentId;
  currentId += 1;
  return id;
}
