export interface IProperty{
    name: string;
    required: boolean;
}

export interface ITypeKind{
  kind: string;
}

export interface ITypeName{
  name: string;
}

/** 
  * Basic shape for a type.
  */
export interface IType extends ITypeKind, ITypeName{
  /** 
    * Describes the specific shape of the type.
    * @remarks 
    * One of:
    *     "any"           -> IntrinsicType
    *     "number"        -> IntrinsicType
    *     "boolean"       -> IntrinsicType
    *     "string"        -> IntrinsicType
    *     "symbol"        -> IntrinsicType
    *     "void"          -> IntrinsicType
    *     "parameter"     -> TypeParameter
    *     "reference"     -> TypeReference
    *     "predicate"     -> TypePredicate
    *     "array"         -> ArrayType
    *     "interface"     -> InterfaceType
    *     "class"         -> ClassType
    *     "tuple"         -> TupleType
    *     "union"         -> UnionType
    *     "intersection"  -> IntersectionType
    *     "function"      -> FunctionType
    */
}

export type AllType = IType | IIntrinsicType;

/**
  * An intrinsic type.
  */
export interface IIntrinsicType extends ITypeKind {
  // "any", "number", "boolean", "string", "symbol", or "void"
}

/**
  * A generic type parameter. 
  */
export interface ITypeParameter extends IType {
    /**
      * An optional constraint for the type parameter.
      */
    constraint?: AllType;
}

/**
  * A reference to a generic type. 
  */
export interface ITypeReference extends IType {

    /**
      * The referenced generic type
      */
    type: AllType;

    /**
      * The generic type arguments, in order.
      */
    typeArguments?: AllType[];
}

export interface ITypePredicate extends IType {
  kind: string; // "predicate"
  
  /**
    * The ordinal offset of the parameter in the parameter list
    */
  parameterIndex: number;
  
  /**
    * The type for the type predicate.
    */
  type: AllType;
}

export interface IArrayType extends IType {
  kind: string; // "array"
  
  /**
    * The element type for the array. 
    */
  elementType: AllType;
}

/**
  * Describes a generic interface.
  */
export interface IInterfaceType extends IType {

    /**
      * Generic type parameters for the type. May be undefined.
      */
    typeParameters?: ITypeParameter[];

    /**
      * Members for the type. May be undefined. 
      * @remarks Contains property, accessor, and method declarations.
      */
    members?: { [key in string | symbol | number]: AllType; };

    extends?: IInterfaceType[];
    /**
      * Call signatures for the type. May be undefined.
      */
    call?: ISignature[];

    /**
      * Construct signatures for the type. May be undefined.
      */
    construct?: ISignature[];

    /**
      * Index signatures for the type. May be undefined.
      */
    index?: ISignature[];
}

/**
  * Describes a class.
  */
export interface IClassType extends IType {
  /**
    * Generic type parameters for the type. May be undefined.
    */
  typeParameters?: ITypeParameter[];

  /**
    * The superclass for the type. 
    */
  extends?: IClassType;

  /**
    * Implemented interfaces.
    */
  implements?: IInterfaceType[];

  /**
    * Members for the type. May be undefined. 
    * @remarks Contains property, accessor, and method declarations.
    */
  members?: {
      [key: string]: AllType;
      [key: number]: AllType;
      // [key: symbol]: Type;
  };
  
  /**
    * Static members for the type. May be undefined. 
    * @remarks Contains property, accessor, and method declarations.
    */
  statics?: {
      [key: string]: AllType;
      [key: number]: AllType;
      // [key: symbol]: Type;
  };

  /**
    * Call signatures for the type. May be undefined.
    */
  call?: ISignature[];

  /**
    * Construct signatures for the type. May be undefined.
    */
  construct?: ISignature[];

  /**
    * Index signatures for the type. May be undefined.
    */
  index?: ISignature[];
  
  /**
    * The constructor function for the class.
    */
  getConstructor?(): Function;
}


/**
  * Describes a tuple type.
  */
export interface ITupleType extends IType {

    /**
      * Types of each element in the tuple.
      */
    elements: AllType[];
}

/**
  * Describes a union type.
  */
export interface IUnionType extends IType {
    /**
      * Types of each member of the union.
      */
    types: AllType[];
}

/**
  * Describes a function type.
  */
export interface IFunctionType extends IType {

    /**
      * The signatures for the function type
      */
    signatures: ISignature[];
}

/**
  * Describes a signature.
  */
export interface ISignature {
    /**
      * A value indicating whether this is a constructor signature.
      */
    construct?: boolean;

    /**
      * Generic type parameters for the function type. May be undefined.
      */
    typeParameters?: ITypeParameter[];

    /**
      * Parameters for the function type.
      */
    parameters: AllType[];

    /**
      * The number of required parameters of the function type.
      */
    length: number;

    /**
      * A value indicating whether the final argument is a rest argument. May be undefined.
      */
    rest?: boolean;

    /**
      * The return type of the function type.
      */
    returns: AllType;
}  

export interface ITypeListProperty {
  [key: string]: IType;
}

export interface ITypeList{
  declare<T extends IType>(type: T): void;
  get<T extends IType>(kind: string, name: string): T;
  Any: IIntrinsicType;
  Number: IIntrinsicType;
  Boolean: IIntrinsicType;
  String: IIntrinsicType;
  Symbol: IIntrinsicType;
  Void: IIntrinsicType;
}