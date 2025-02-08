if (typeof Symbol === 'undefined' || !Symbol.observable) {
  ;(Symbol as any).observable = Symbol.for('observable')
}
