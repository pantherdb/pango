export interface Term {
  id: string;
  label: string;
  displayId: string;
  aspect: string;
  isGoSlim: boolean;

  // for display
  evidenceType: string;

}

export interface CategoryItem extends Term {
  count: number;
  color: string;
  aspectShorthand: string;
  width: string;
  countPos: string;
}