import PureComponentWithStudio from '$studio/componentModel/react/utils/PureComponentWithStudio'
import AbstractDerivation from '$shared/DataVerse/derivations/AbstractDerivation'
import {DictAtom, UnwrapDictAtom} from '$shared/DataVerse/atoms/dictAtom'
import {PointerDerivation} from '$shared/DataVerse/derivations/pointer'
import AbstractDerivedDict from '$shared/DataVerse/derivations/dicts/AbstractDerivedDict'
import dictAtom from '$shared//DataVerse/atoms/dictAtom'
import DerivationAsReactElement from '../componentModel/react/utils/DerivationAsReactElement'
import React from 'react'
import boxAtom, {BoxAtom} from '$shared/DataVerse/atoms/boxAtom'
import Studio from '$studio/bootstrap/Studio'

type AtomType<InnerProps> = DictAtom<InnerProps>

type PointerType<InnerProps> = PointerDerivation<
  AbstractDerivedDict<UnwrapDictAtom<AtomType<InnerProps>>>
>

type ChildrenType<InnerProps> = (
  p: PointerType<InnerProps>,
  studio: Studio,
) => AbstractDerivation<React.ReactNode>

type Props<InnerProps> = {
  props: InnerProps
  children: ChildrenType<InnerProps>
}

export default class PropsAsOldStylePointer<InnerProps> extends PureComponentWithStudio<
  Props<InnerProps>,
  {}
> {
  _childrenAtom: BoxAtom<ChildrenType<InnerProps>>
  _propsAtom: AtomType<InnerProps>
  _renderD: AbstractDerivation<React.ReactNode>
  constructor(props: Props<InnerProps>, context: $IntentionalAny) {
    super(props, context)
    this._propsAtom = dictAtom(props.props || {})
    this._childrenAtom = boxAtom(props.children)
    const prospP = this._propsAtom.derivedDict().pointer()
    this._renderD = this._childrenAtom
      .derivation()
      .flatMap(childrenFn => childrenFn(prospP, this.studio))
  }

  componentWillReceiveProps(newProps: Props<InnerProps>) {
    if (newProps.children !== this.props.children) {
      this._childrenAtom.set(newProps.children)
    }

    for (const key in this.props.props) {
      if (!newProps.props.hasOwnProperty(key)) {
        this._propsAtom.deleteProp(key)
      }
    }

    for (const key in newProps.props) {
      const val = newProps.props[key]
      if (val !== this.props.props[key]) {
        this._propsAtom.setProp(key, val)
      }
    }
  }

  render() {
    return <DerivationAsReactElement derivation={this._renderD} />
  }
}
