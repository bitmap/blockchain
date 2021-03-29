export abstract class Trampoline<A> {
  abstract map<B>(ab: (a: A) => B): Trampoline<B>
  abstract flatMap<B>(ab: (a: A) => Trampoline<B>): Trampoline<B>

  zip<B>(tb: Trampoline<B>): Trampoline<[A, B]> {
    return this.flatMap(a => tb.map(b => [a, b] as [A, B]))
  }
}

class Done<A> extends Trampoline<A> {
  constructor(readonly a: A) {
    super()
  }
  map<B>(ab: (a: A) => B): Trampoline<B> {
    return new Done(ab(this.a))
  }
  flatMap<B>(ab: (a: A) => Trampoline<B>): Trampoline<B> {
    return ab(this.a)
  }
}

class More<A> extends Trampoline<A> {
  constructor(readonly fn: () => Trampoline<A>) {
    super()
  }

  map<B>(ab: (a: A) => B): Trampoline<B> {
    return new More(() => this.fn().map(ab))
  }
  flatMap<B>(ab: (a: A) => Trampoline<B>): Trampoline<B> {
    return new More(() => this.fn().flatMap(ab))
  }
}

export function done<A>(a: A): Done<A> {
  return new Done(a)
}

export function more<A>(a: () => Trampoline<A>): More<A> {
  return new More(a)
}

export const interpret = <T, ARGS extends T[], R>(fn: (...t: ARGS) => Trampoline<R>) => {
  return (...t: ARGS): R => {
    let result: Trampoline<R> = fn(...t)
    while (true) {
      if (result instanceof More) {
        result = result.fn()
      } else if (result instanceof Done) {
        return result.a
      }
    }
  }
}
