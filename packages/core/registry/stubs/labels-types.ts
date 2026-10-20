/* The copied dictionary type: open, because a copy carries only the label keys of the components added to it. */
export interface YoujLabels {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- a copy carries any component's label functions, so their arguments are open
  [key: string]: string | ((...args: any[]) => string)
}
