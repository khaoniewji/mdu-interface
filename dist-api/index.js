"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a;
var createNode = (part, inert) => {
  const inertMap = (inert == null ? void 0 : inert.length) ? {} : null;
  if (inertMap)
    for (const child of inert)
      inertMap[child.part.charCodeAt(0)] = child;
  return {
    part,
    store: null,
    inert: inertMap,
    params: null,
    wildcardStore: null
  };
};
var cloneNode = (node, part) => ({
  ...node,
  part
});
var createParamNode = (name) => ({
  name,
  store: null,
  inert: null
});
var Memoirist = (_a = class {
  constructor() {
    __publicField(this, "root", {});
    __publicField(this, "history", []);
  }
  add(method, path, store, {
    ignoreError = false,
    ignoreHistory = false
  } = {}) {
    if (typeof path !== "string")
      throw new TypeError("Route path must be a string");
    if (path === "")
      path = "/";
    else if (path[0] !== "/")
      path = `/${path}`;
    const isWildcard = path[path.length - 1] === "*";
    const optionalParams = path.match(_a.regex.optionalParams);
    if (optionalParams) {
      const originalPath = path.replaceAll("?", "");
      this.add(method, originalPath, store, {
        ignoreError
      });
      for (let i = 0; i < optionalParams.length; i++) {
        let newPath = path.replace("/" + optionalParams[i], "");
        this.add(method, newPath, store, {
          ignoreError: true
        });
      }
      return store;
    }
    if (optionalParams)
      path = path.replaceAll("?", "");
    if (this.history.find(([m, p, s]) => m === method && p === path))
      return store;
    if (isWildcard || optionalParams && path.charCodeAt(path.length - 1) === 63)
      path = path.slice(0, -1);
    if (!ignoreHistory)
      this.history.push([method, path, store]);
    const inertParts = path.split(_a.regex.static);
    const paramParts = path.match(_a.regex.params) || [];
    if (inertParts[inertParts.length - 1] === "")
      inertParts.pop();
    let node;
    if (!this.root[method])
      node = this.root[method] = createNode("/");
    else
      node = this.root[method];
    let paramPartsIndex = 0;
    for (let i = 0; i < inertParts.length; ++i) {
      let part = inertParts[i];
      if (i > 0) {
        const param = paramParts[paramPartsIndex++].slice(1);
        if (node.params === null)
          node.params = createParamNode(param);
        else if (node.params.name !== param) {
          if (ignoreError)
            return store;
          else
            throw new Error(
              `Cannot create route "${path}" with parameter "${param}" because a route already exists with a different parameter name ("${node.params.name}") in the same location`
            );
        }
        const params = node.params;
        if (params.inert === null) {
          node = params.inert = createNode(part);
          continue;
        }
        node = params.inert;
      }
      for (let j = 0; ; ) {
        if (j === part.length) {
          if (j < node.part.length) {
            const childNode = cloneNode(node, node.part.slice(j));
            Object.assign(node, createNode(part, [childNode]));
          }
          break;
        }
        if (j === node.part.length) {
          if (node.inert === null)
            node.inert = {};
          const inert = node.inert[part.charCodeAt(j)];
          if (inert) {
            node = inert;
            part = part.slice(j);
            j = 0;
            continue;
          }
          const childNode = createNode(part.slice(j));
          node.inert[part.charCodeAt(j)] = childNode;
          node = childNode;
          break;
        }
        if (part[j] !== node.part[j]) {
          const existingChild = cloneNode(node, node.part.slice(j));
          const newChild = createNode(part.slice(j));
          Object.assign(
            node,
            createNode(node.part.slice(0, j), [
              existingChild,
              newChild
            ])
          );
          node = newChild;
          break;
        }
        ++j;
      }
    }
    if (paramPartsIndex < paramParts.length) {
      const param = paramParts[paramPartsIndex];
      const name = param.slice(1);
      if (node.params === null)
        node.params = createParamNode(name);
      else if (node.params.name !== name) {
        if (ignoreError)
          return store;
        else
          throw new Error(
            `Cannot create route "${path}" with parameter "${name}" because a route already exists with a different parameter name ("${node.params.name}") in the same location`
          );
      }
      if (node.params.store === null)
        node.params.store = store;
      return node.params.store;
    }
    if (isWildcard) {
      if (node.wildcardStore === null)
        node.wildcardStore = store;
      return node.wildcardStore;
    }
    if (node.store === null)
      node.store = store;
    return node.store;
  }
  find(method, url) {
    const root = this.root[method];
    if (!root)
      return null;
    return matchRoute(url, url.length, root, 0);
  }
}, __publicField(_a, "regex", {
  static: /:.+?(?=\/|$)/,
  params: /:.+?(?=\/|$)/g,
  optionalParams: /:.+?\?(?=\/|$)/g
}), _a);
var matchRoute = (url, urlLength, node, startIndex) => {
  const part = node.part;
  const length = part.length;
  const endIndex = startIndex + length;
  if (length > 1) {
    if (endIndex > urlLength)
      return null;
    if (length < 15) {
      for (let i = 1, j = startIndex + 1; i < length; ++i, ++j)
        if (part.charCodeAt(i) !== url.charCodeAt(j))
          return null;
    } else if (url.slice(startIndex, endIndex) !== part)
      return null;
  }
  if (endIndex === urlLength) {
    if (node.store !== null)
      return {
        store: node.store,
        params: {}
      };
    if (node.wildcardStore !== null)
      return {
        store: node.wildcardStore,
        params: { "*": "" }
      };
    return null;
  }
  if (node.inert !== null) {
    const inert = node.inert[url.charCodeAt(endIndex)];
    if (inert !== void 0) {
      const route = matchRoute(url, urlLength, inert, endIndex);
      if (route !== null)
        return route;
    }
  }
  if (node.params !== null) {
    const { store, name, inert } = node.params;
    const slashIndex = url.indexOf("/", endIndex);
    if (slashIndex !== endIndex) {
      if (slashIndex === -1 || slashIndex >= urlLength) {
        if (store !== null) {
          const params = {};
          params[name] = url.substring(endIndex, urlLength);
          return {
            store,
            params
          };
        }
      } else if (inert !== null) {
        const route = matchRoute(url, urlLength, inert, slashIndex);
        if (route !== null) {
          route.params[name] = url.substring(endIndex, slashIndex);
          return route;
        }
      }
    }
  }
  if (node.wildcardStore !== null)
    return {
      store: node.wildcardStore,
      params: {
        "*": url.substring(endIndex, urlLength)
      }
    };
  return null;
};
function IsAsyncIterator$3(value) {
  return IsObject$3(value) && !IsArray$3(value) && !IsUint8Array$3(value) && Symbol.asyncIterator in value;
}
function IsArray$3(value) {
  return Array.isArray(value);
}
function IsBigInt$3(value) {
  return typeof value === "bigint";
}
function IsBoolean$3(value) {
  return typeof value === "boolean";
}
function IsDate$3(value) {
  return value instanceof globalThis.Date;
}
function IsFunction$3(value) {
  return typeof value === "function";
}
function IsIterator$3(value) {
  return IsObject$3(value) && !IsArray$3(value) && !IsUint8Array$3(value) && Symbol.iterator in value;
}
function IsNull$3(value) {
  return value === null;
}
function IsNumber$3(value) {
  return typeof value === "number";
}
function IsObject$3(value) {
  return typeof value === "object" && value !== null;
}
function IsRegExp$2(value) {
  return value instanceof globalThis.RegExp;
}
function IsString$3(value) {
  return typeof value === "string";
}
function IsSymbol$3(value) {
  return typeof value === "symbol";
}
function IsUint8Array$3(value) {
  return value instanceof globalThis.Uint8Array;
}
function IsUndefined$3(value) {
  return value === void 0;
}
function ArrayType$1(value) {
  return value.map((value2) => Visit$b(value2));
}
function DateType$1(value) {
  return new Date(value.getTime());
}
function Uint8ArrayType$1(value) {
  return new Uint8Array(value);
}
function RegExpType(value) {
  return new RegExp(value.source, value.flags);
}
function ObjectType$1(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Visit$b(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Visit$b(value[key]);
  }
  return result;
}
function Visit$b(value) {
  return IsArray$3(value) ? ArrayType$1(value) : IsDate$3(value) ? DateType$1(value) : IsUint8Array$3(value) ? Uint8ArrayType$1(value) : IsRegExp$2(value) ? RegExpType(value) : IsObject$3(value) ? ObjectType$1(value) : value;
}
function Clone$1(value) {
  return Visit$b(value);
}
function CloneType(schema, options) {
  return Clone$1(schema);
}
function IsAsyncIterator$2(value) {
  return IsObject$2(value) && Symbol.asyncIterator in value;
}
function IsIterator$2(value) {
  return IsObject$2(value) && Symbol.iterator in value;
}
function IsPromise$2(value) {
  return value instanceof Promise;
}
function IsDate$2(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}
function IsMap(value) {
  return value instanceof globalThis.Map;
}
function IsSet(value) {
  return value instanceof globalThis.Set;
}
function IsTypedArray(value) {
  return ArrayBuffer.isView(value);
}
function IsUint8Array$2(value) {
  return value instanceof globalThis.Uint8Array;
}
function HasPropertyKey(value, key) {
  return key in value;
}
function IsObject$2(value) {
  return value !== null && typeof value === "object";
}
function IsArray$2(value) {
  return Array.isArray(value) && !ArrayBuffer.isView(value);
}
function IsUndefined$2(value) {
  return value === void 0;
}
function IsNull$2(value) {
  return value === null;
}
function IsBoolean$2(value) {
  return typeof value === "boolean";
}
function IsNumber$2(value) {
  return typeof value === "number";
}
function IsInteger$2(value) {
  return Number.isInteger(value);
}
function IsBigInt$2(value) {
  return typeof value === "bigint";
}
function IsString$2(value) {
  return typeof value === "string";
}
function IsFunction$2(value) {
  return typeof value === "function";
}
function IsSymbol$2(value) {
  return typeof value === "symbol";
}
function IsValueType(value) {
  return IsBigInt$2(value) || IsBoolean$2(value) || IsNull$2(value) || IsNumber$2(value) || IsString$2(value) || IsSymbol$2(value) || IsUndefined$2(value);
}
var TypeSystemPolicy;
(function(TypeSystemPolicy2) {
  TypeSystemPolicy2.InstanceMode = "default";
  TypeSystemPolicy2.ExactOptionalPropertyTypes = false;
  TypeSystemPolicy2.AllowArrayObject = false;
  TypeSystemPolicy2.AllowNaN = false;
  TypeSystemPolicy2.AllowNullVoid = false;
  function IsExactOptionalProperty(value, key) {
    return TypeSystemPolicy2.ExactOptionalPropertyTypes ? key in value : value[key] !== void 0;
  }
  TypeSystemPolicy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    const isObject2 = IsObject$2(value);
    return TypeSystemPolicy2.AllowArrayObject ? isObject2 : isObject2 && !IsArray$2(value);
  }
  TypeSystemPolicy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return IsObjectLike(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
  }
  TypeSystemPolicy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy2.AllowNaN ? IsNumber$2(value) : Number.isFinite(value);
  }
  TypeSystemPolicy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    const isUndefined = IsUndefined$2(value);
    return TypeSystemPolicy2.AllowNullVoid ? isUndefined || value === null : isUndefined;
  }
  TypeSystemPolicy2.IsVoidLike = IsVoidLike;
})(TypeSystemPolicy || (TypeSystemPolicy = {}));
function ImmutableArray(value) {
  return globalThis.Object.freeze(value).map((value2) => Immutable(value2));
}
function ImmutableDate(value) {
  return value;
}
function ImmutableUint8Array(value) {
  return value;
}
function ImmutableRegExp(value) {
  return value;
}
function ImmutableObject(value) {
  const result = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    result[key] = Immutable(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    result[key] = Immutable(value[key]);
  }
  return globalThis.Object.freeze(result);
}
function Immutable(value) {
  return IsArray$3(value) ? ImmutableArray(value) : IsDate$3(value) ? ImmutableDate(value) : IsUint8Array$3(value) ? ImmutableUint8Array(value) : IsRegExp$2(value) ? ImmutableRegExp(value) : IsObject$3(value) ? ImmutableObject(value) : value;
}
function CreateType(schema, options) {
  const result = options !== void 0 ? { ...options, ...schema } : schema;
  switch (TypeSystemPolicy.InstanceMode) {
    case "freeze":
      return Immutable(result);
    case "clone":
      return Clone$1(result);
    default:
      return result;
  }
}
class TypeBoxError extends Error {
  constructor(message) {
    super(message);
  }
}
const TransformKind = Symbol.for("TypeBox.Transform");
const ReadonlyKind = Symbol.for("TypeBox.Readonly");
const OptionalKind = Symbol.for("TypeBox.Optional");
const Hint = Symbol.for("TypeBox.Hint");
const Kind$1 = Symbol.for("TypeBox.Kind");
function IsReadonly(value) {
  return IsObject$3(value) && value[ReadonlyKind] === "Readonly";
}
function IsOptional$1(value) {
  return IsObject$3(value) && value[OptionalKind] === "Optional";
}
function IsAny$1(value) {
  return IsKindOf$1(value, "Any");
}
function IsArray$1(value) {
  return IsKindOf$1(value, "Array");
}
function IsAsyncIterator$1(value) {
  return IsKindOf$1(value, "AsyncIterator");
}
function IsBigInt$1(value) {
  return IsKindOf$1(value, "BigInt");
}
function IsBoolean$1(value) {
  return IsKindOf$1(value, "Boolean");
}
function IsComputed$1(value) {
  return IsKindOf$1(value, "Computed");
}
function IsConstructor$1(value) {
  return IsKindOf$1(value, "Constructor");
}
function IsDate$1(value) {
  return IsKindOf$1(value, "Date");
}
function IsFunction$1(value) {
  return IsKindOf$1(value, "Function");
}
function IsInteger$1(value) {
  return IsKindOf$1(value, "Integer");
}
function IsIntersect$1(value) {
  return IsKindOf$1(value, "Intersect");
}
function IsIterator$1(value) {
  return IsKindOf$1(value, "Iterator");
}
function IsKindOf$1(value, kind) {
  return IsObject$3(value) && Kind$1 in value && value[Kind$1] === kind;
}
function IsLiteralValue$1(value) {
  return IsBoolean$3(value) || IsNumber$3(value) || IsString$3(value);
}
function IsLiteral$1(value) {
  return IsKindOf$1(value, "Literal");
}
function IsMappedKey$1(value) {
  return IsKindOf$1(value, "MappedKey");
}
function IsMappedResult$1(value) {
  return IsKindOf$1(value, "MappedResult");
}
function IsNever$1(value) {
  return IsKindOf$1(value, "Never");
}
function IsNot$1(value) {
  return IsKindOf$1(value, "Not");
}
function IsNull$1(value) {
  return IsKindOf$1(value, "Null");
}
function IsNumber$1(value) {
  return IsKindOf$1(value, "Number");
}
function IsObject$1(value) {
  return IsKindOf$1(value, "Object");
}
function IsPromise$1(value) {
  return IsKindOf$1(value, "Promise");
}
function IsRecord$1(value) {
  return IsKindOf$1(value, "Record");
}
function IsRef$1(value) {
  return IsKindOf$1(value, "Ref");
}
function IsRegExp$1(value) {
  return IsKindOf$1(value, "RegExp");
}
function IsString$1(value) {
  return IsKindOf$1(value, "String");
}
function IsSymbol$1(value) {
  return IsKindOf$1(value, "Symbol");
}
function IsTemplateLiteral$1(value) {
  return IsKindOf$1(value, "TemplateLiteral");
}
function IsThis$1(value) {
  return IsKindOf$1(value, "This");
}
function IsTransform$1(value) {
  return IsObject$3(value) && TransformKind in value;
}
function IsTuple$1(value) {
  return IsKindOf$1(value, "Tuple");
}
function IsUndefined$1(value) {
  return IsKindOf$1(value, "Undefined");
}
function IsUnion$1(value) {
  return IsKindOf$1(value, "Union");
}
function IsUint8Array$1(value) {
  return IsKindOf$1(value, "Uint8Array");
}
function IsUnknown$1(value) {
  return IsKindOf$1(value, "Unknown");
}
function IsUnsafe$1(value) {
  return IsKindOf$1(value, "Unsafe");
}
function IsVoid$1(value) {
  return IsKindOf$1(value, "Void");
}
function IsKind$1(value) {
  return IsObject$3(value) && Kind$1 in value && IsString$3(value[Kind$1]);
}
function IsSchema$1(value) {
  return IsAny$1(value) || IsArray$1(value) || IsBoolean$1(value) || IsBigInt$1(value) || IsAsyncIterator$1(value) || IsComputed$1(value) || IsConstructor$1(value) || IsDate$1(value) || IsFunction$1(value) || IsInteger$1(value) || IsIntersect$1(value) || IsIterator$1(value) || IsLiteral$1(value) || IsMappedKey$1(value) || IsMappedResult$1(value) || IsNever$1(value) || IsNot$1(value) || IsNull$1(value) || IsNumber$1(value) || IsObject$1(value) || IsPromise$1(value) || IsRecord$1(value) || IsRef$1(value) || IsRegExp$1(value) || IsString$1(value) || IsSymbol$1(value) || IsTemplateLiteral$1(value) || IsThis$1(value) || IsTuple$1(value) || IsUndefined$1(value) || IsUnion$1(value) || IsUint8Array$1(value) || IsUnknown$1(value) || IsUnsafe$1(value) || IsVoid$1(value) || IsKind$1(value);
}
const KnownTypes = [
  "Any",
  "Array",
  "AsyncIterator",
  "BigInt",
  "Boolean",
  "Computed",
  "Constructor",
  "Date",
  "Enum",
  "Function",
  "Integer",
  "Intersect",
  "Iterator",
  "Literal",
  "MappedKey",
  "MappedResult",
  "Not",
  "Null",
  "Number",
  "Object",
  "Promise",
  "Record",
  "Ref",
  "RegExp",
  "String",
  "Symbol",
  "TemplateLiteral",
  "This",
  "Tuple",
  "Undefined",
  "Union",
  "Uint8Array",
  "Unknown",
  "Void"
];
function IsPattern(value) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}
function IsControlCharacterFree(value) {
  if (!IsString$3(value))
    return false;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 7 && code <= 13 || code === 27 || code === 127) {
      return false;
    }
  }
  return true;
}
function IsAdditionalProperties(value) {
  return IsOptionalBoolean(value) || IsSchema(value);
}
function IsOptionalBigInt(value) {
  return IsUndefined$3(value) || IsBigInt$3(value);
}
function IsOptionalNumber(value) {
  return IsUndefined$3(value) || IsNumber$3(value);
}
function IsOptionalBoolean(value) {
  return IsUndefined$3(value) || IsBoolean$3(value);
}
function IsOptionalString(value) {
  return IsUndefined$3(value) || IsString$3(value);
}
function IsOptionalPattern(value) {
  return IsUndefined$3(value) || IsString$3(value) && IsControlCharacterFree(value) && IsPattern(value);
}
function IsOptionalFormat(value) {
  return IsUndefined$3(value) || IsString$3(value) && IsControlCharacterFree(value);
}
function IsOptionalSchema(value) {
  return IsUndefined$3(value) || IsSchema(value);
}
function IsOptional(value) {
  return IsObject$3(value) && value[OptionalKind] === "Optional";
}
function IsAny(value) {
  return IsKindOf(value, "Any") && IsOptionalString(value.$id);
}
function IsArray(value) {
  return IsKindOf(value, "Array") && value.type === "array" && IsOptionalString(value.$id) && IsSchema(value.items) && IsOptionalNumber(value.minItems) && IsOptionalNumber(value.maxItems) && IsOptionalBoolean(value.uniqueItems) && IsOptionalSchema(value.contains) && IsOptionalNumber(value.minContains) && IsOptionalNumber(value.maxContains);
}
function IsAsyncIterator(value) {
  return IsKindOf(value, "AsyncIterator") && value.type === "AsyncIterator" && IsOptionalString(value.$id) && IsSchema(value.items);
}
function IsBigInt(value) {
  return IsKindOf(value, "BigInt") && value.type === "bigint" && IsOptionalString(value.$id) && IsOptionalBigInt(value.exclusiveMaximum) && IsOptionalBigInt(value.exclusiveMinimum) && IsOptionalBigInt(value.maximum) && IsOptionalBigInt(value.minimum) && IsOptionalBigInt(value.multipleOf);
}
function IsBoolean(value) {
  return IsKindOf(value, "Boolean") && value.type === "boolean" && IsOptionalString(value.$id);
}
function IsComputed(value) {
  return IsKindOf(value, "Computed") && IsString$3(value.target) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema));
}
function IsConstructor(value) {
  return IsKindOf(value, "Constructor") && value.type === "Constructor" && IsOptionalString(value.$id) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
}
function IsDate(value) {
  return IsKindOf(value, "Date") && value.type === "Date" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximumTimestamp) && IsOptionalNumber(value.exclusiveMinimumTimestamp) && IsOptionalNumber(value.maximumTimestamp) && IsOptionalNumber(value.minimumTimestamp) && IsOptionalNumber(value.multipleOfTimestamp);
}
function IsFunction(value) {
  return IsKindOf(value, "Function") && value.type === "Function" && IsOptionalString(value.$id) && IsArray$3(value.parameters) && value.parameters.every((schema) => IsSchema(schema)) && IsSchema(value.returns);
}
function IsInteger(value) {
  return IsKindOf(value, "Integer") && value.type === "integer" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsProperties(value) {
  return IsObject$3(value) && Object.entries(value).every(([key, schema]) => IsControlCharacterFree(key) && IsSchema(schema));
}
function IsIntersect(value) {
  return IsKindOf(value, "Intersect") && (IsString$3(value.type) && value.type !== "object" ? false : true) && IsArray$3(value.allOf) && value.allOf.every((schema) => IsSchema(schema) && !IsTransform(schema)) && IsOptionalString(value.type) && (IsOptionalBoolean(value.unevaluatedProperties) || IsOptionalSchema(value.unevaluatedProperties)) && IsOptionalString(value.$id);
}
function IsIterator(value) {
  return IsKindOf(value, "Iterator") && value.type === "Iterator" && IsOptionalString(value.$id) && IsSchema(value.items);
}
function IsKindOf(value, kind) {
  return IsObject$3(value) && Kind$1 in value && value[Kind$1] === kind;
}
function IsLiteralString(value) {
  return IsLiteral(value) && IsString$3(value.const);
}
function IsLiteralNumber(value) {
  return IsLiteral(value) && IsNumber$3(value.const);
}
function IsLiteralBoolean(value) {
  return IsLiteral(value) && IsBoolean$3(value.const);
}
function IsLiteral(value) {
  return IsKindOf(value, "Literal") && IsOptionalString(value.$id) && IsLiteralValue(value.const);
}
function IsLiteralValue(value) {
  return IsBoolean$3(value) || IsNumber$3(value) || IsString$3(value);
}
function IsMappedKey(value) {
  return IsKindOf(value, "MappedKey") && IsArray$3(value.keys) && value.keys.every((key) => IsNumber$3(key) || IsString$3(key));
}
function IsMappedResult(value) {
  return IsKindOf(value, "MappedResult") && IsProperties(value.properties);
}
function IsNever(value) {
  return IsKindOf(value, "Never") && IsObject$3(value.not) && Object.getOwnPropertyNames(value.not).length === 0;
}
function IsNot(value) {
  return IsKindOf(value, "Not") && IsSchema(value.not);
}
function IsNull(value) {
  return IsKindOf(value, "Null") && value.type === "null" && IsOptionalString(value.$id);
}
function IsNumber(value) {
  return IsKindOf(value, "Number") && value.type === "number" && IsOptionalString(value.$id) && IsOptionalNumber(value.exclusiveMaximum) && IsOptionalNumber(value.exclusiveMinimum) && IsOptionalNumber(value.maximum) && IsOptionalNumber(value.minimum) && IsOptionalNumber(value.multipleOf);
}
function IsObject(value) {
  return IsKindOf(value, "Object") && value.type === "object" && IsOptionalString(value.$id) && IsProperties(value.properties) && IsAdditionalProperties(value.additionalProperties) && IsOptionalNumber(value.minProperties) && IsOptionalNumber(value.maxProperties);
}
function IsPromise(value) {
  return IsKindOf(value, "Promise") && value.type === "Promise" && IsOptionalString(value.$id) && IsSchema(value.item);
}
function IsRecord(value) {
  return IsKindOf(value, "Record") && value.type === "object" && IsOptionalString(value.$id) && IsAdditionalProperties(value.additionalProperties) && IsObject$3(value.patternProperties) && ((schema) => {
    const keys = Object.getOwnPropertyNames(schema.patternProperties);
    return keys.length === 1 && IsPattern(keys[0]) && IsObject$3(schema.patternProperties) && IsSchema(schema.patternProperties[keys[0]]);
  })(value);
}
function IsRef(value) {
  return IsKindOf(value, "Ref") && IsOptionalString(value.$id) && IsString$3(value.$ref);
}
function IsRegExp(value) {
  return IsKindOf(value, "RegExp") && IsOptionalString(value.$id) && IsString$3(value.source) && IsString$3(value.flags) && IsOptionalNumber(value.maxLength) && IsOptionalNumber(value.minLength);
}
function IsString(value) {
  return IsKindOf(value, "String") && value.type === "string" && IsOptionalString(value.$id) && IsOptionalNumber(value.minLength) && IsOptionalNumber(value.maxLength) && IsOptionalPattern(value.pattern) && IsOptionalFormat(value.format);
}
function IsSymbol(value) {
  return IsKindOf(value, "Symbol") && value.type === "symbol" && IsOptionalString(value.$id);
}
function IsTemplateLiteral(value) {
  return IsKindOf(value, "TemplateLiteral") && value.type === "string" && IsString$3(value.pattern) && value.pattern[0] === "^" && value.pattern[value.pattern.length - 1] === "$";
}
function IsThis(value) {
  return IsKindOf(value, "This") && IsOptionalString(value.$id) && IsString$3(value.$ref);
}
function IsTransform(value) {
  return IsObject$3(value) && TransformKind in value;
}
function IsTuple(value) {
  return IsKindOf(value, "Tuple") && value.type === "array" && IsOptionalString(value.$id) && IsNumber$3(value.minItems) && IsNumber$3(value.maxItems) && value.minItems === value.maxItems && // empty
  (IsUndefined$3(value.items) && IsUndefined$3(value.additionalItems) && value.minItems === 0 || IsArray$3(value.items) && value.items.every((schema) => IsSchema(schema)));
}
function IsUndefined(value) {
  return IsKindOf(value, "Undefined") && value.type === "undefined" && IsOptionalString(value.$id);
}
function IsUnion(value) {
  return IsKindOf(value, "Union") && IsOptionalString(value.$id) && IsObject$3(value) && IsArray$3(value.anyOf) && value.anyOf.every((schema) => IsSchema(schema));
}
function IsUint8Array(value) {
  return IsKindOf(value, "Uint8Array") && value.type === "Uint8Array" && IsOptionalString(value.$id) && IsOptionalNumber(value.minByteLength) && IsOptionalNumber(value.maxByteLength);
}
function IsUnknown(value) {
  return IsKindOf(value, "Unknown") && IsOptionalString(value.$id);
}
function IsUnsafe(value) {
  return IsKindOf(value, "Unsafe");
}
function IsVoid(value) {
  return IsKindOf(value, "Void") && value.type === "void" && IsOptionalString(value.$id);
}
function IsKind(value) {
  return IsObject$3(value) && Kind$1 in value && IsString$3(value[Kind$1]) && !KnownTypes.includes(value[Kind$1]);
}
function IsSchema(value) {
  return IsObject$3(value) && (IsAny(value) || IsArray(value) || IsBoolean(value) || IsBigInt(value) || IsAsyncIterator(value) || IsComputed(value) || IsConstructor(value) || IsDate(value) || IsFunction(value) || IsInteger(value) || IsIntersect(value) || IsIterator(value) || IsLiteral(value) || IsMappedKey(value) || IsMappedResult(value) || IsNever(value) || IsNot(value) || IsNull(value) || IsNumber(value) || IsObject(value) || IsPromise(value) || IsRecord(value) || IsRef(value) || IsRegExp(value) || IsString(value) || IsSymbol(value) || IsTemplateLiteral(value) || IsThis(value) || IsTuple(value) || IsUndefined(value) || IsUnion(value) || IsUint8Array(value) || IsUnknown(value) || IsUnsafe(value) || IsVoid(value) || IsKind(value));
}
const PatternBoolean = "(true|false)";
const PatternNumber = "(0|[1-9][0-9]*)";
const PatternString = "(.*)";
const PatternNever = "(?!.*)";
const PatternNumberExact = `^${PatternNumber}$`;
const PatternStringExact = `^${PatternString}$`;
const PatternNeverExact = `^${PatternNever}$`;
const map$1 = /* @__PURE__ */ new Map();
function Has$1(format) {
  return map$1.has(format);
}
function Set$2(format, func) {
  map$1.set(format, func);
}
function Get$1(format) {
  return map$1.get(format);
}
const map = /* @__PURE__ */ new Map();
function Has(kind) {
  return map.has(kind);
}
function Set$1(kind, func) {
  map.set(kind, func);
}
function Get(kind) {
  return map.get(kind);
}
function SetIncludes(T, S) {
  return T.includes(S);
}
function SetDistinct(T) {
  return [...new Set(T)];
}
function SetIntersect(T, S) {
  return T.filter((L) => S.includes(L));
}
function SetIntersectManyResolve(T, Init) {
  return T.reduce((Acc, L) => {
    return SetIntersect(Acc, L);
  }, Init);
}
function SetIntersectMany(T) {
  return T.length === 1 ? T[0] : T.length > 1 ? SetIntersectManyResolve(T.slice(1), T[0]) : [];
}
function SetUnionMany(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...L);
  return Acc;
}
function Any(options) {
  return CreateType({ [Kind$1]: "Any" }, options);
}
function Array$1(items, options) {
  return CreateType({ [Kind$1]: "Array", type: "array", items }, options);
}
function AsyncIterator(items, options) {
  return CreateType({ [Kind$1]: "AsyncIterator", type: "AsyncIterator", items }, options);
}
function Computed(target, parameters, options) {
  return CreateType({ [Kind$1]: "Computed", target, parameters }, options);
}
function DiscardKey(value, key) {
  const { [key]: _, ...rest } = value;
  return rest;
}
function Discard(value, keys) {
  return keys.reduce((acc, key) => DiscardKey(acc, key), value);
}
function Never(options) {
  return CreateType({ [Kind$1]: "Never", not: {} }, options);
}
function MappedResult(properties) {
  return CreateType({
    [Kind$1]: "MappedResult",
    properties
  });
}
function Constructor(parameters, returns, options) {
  return CreateType({ [Kind$1]: "Constructor", type: "Constructor", parameters, returns }, options);
}
function Function$1(parameters, returns, options) {
  return CreateType({ [Kind$1]: "Function", type: "Function", parameters, returns }, options);
}
function UnionCreate(T, options) {
  return CreateType({ [Kind$1]: "Union", anyOf: T }, options);
}
function IsUnionOptional(types) {
  return types.some((type2) => IsOptional$1(type2));
}
function RemoveOptionalFromRest$1(types) {
  return types.map((left) => IsOptional$1(left) ? RemoveOptionalFromType$1(left) : left);
}
function RemoveOptionalFromType$1(T) {
  return Discard(T, [OptionalKind]);
}
function ResolveUnion(types, options) {
  const isOptional2 = IsUnionOptional(types);
  return isOptional2 ? Optional(UnionCreate(RemoveOptionalFromRest$1(types), options)) : UnionCreate(RemoveOptionalFromRest$1(types), options);
}
function UnionEvaluated(T, options) {
  return T.length === 1 ? CreateType(T[0], options) : T.length === 0 ? Never(options) : ResolveUnion(T, options);
}
function Union$1(types, options) {
  return types.length === 0 ? Never(options) : types.length === 1 ? CreateType(types[0], options) : UnionCreate(types, options);
}
class TemplateLiteralParserError extends TypeBoxError {
}
function Unescape(pattern) {
  return pattern.replace(/\\\$/g, "$").replace(/\\\*/g, "*").replace(/\\\^/g, "^").replace(/\\\|/g, "|").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
}
function IsNonEscaped(pattern, index, char) {
  return pattern[index] === char && pattern.charCodeAt(index - 1) !== 92;
}
function IsOpenParen(pattern, index) {
  return IsNonEscaped(pattern, index, "(");
}
function IsCloseParen(pattern, index) {
  return IsNonEscaped(pattern, index, ")");
}
function IsSeparator(pattern, index) {
  return IsNonEscaped(pattern, index, "|");
}
function IsGroup(pattern) {
  if (!(IsOpenParen(pattern, 0) && IsCloseParen(pattern, pattern.length - 1)))
    return false;
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (count === 0 && index !== pattern.length - 1)
      return false;
  }
  return true;
}
function InGroup(pattern) {
  return pattern.slice(1, pattern.length - 1);
}
function IsPrecedenceOr(pattern) {
  let count = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0)
      return true;
  }
  return false;
}
function IsPrecedenceAnd(pattern) {
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      return true;
  }
  return false;
}
function Or(pattern) {
  let [count, start] = [0, 0];
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index))
      count += 1;
    if (IsCloseParen(pattern, index))
      count -= 1;
    if (IsSeparator(pattern, index) && count === 0) {
      const range2 = pattern.slice(start, index);
      if (range2.length > 0)
        expressions.push(TemplateLiteralParse(range2));
      start = index + 1;
    }
  }
  const range = pattern.slice(start);
  if (range.length > 0)
    expressions.push(TemplateLiteralParse(range));
  if (expressions.length === 0)
    return { type: "const", const: "" };
  if (expressions.length === 1)
    return expressions[0];
  return { type: "or", expr: expressions };
}
function And(pattern) {
  function Group(value, index) {
    if (!IsOpenParen(value, index))
      throw new TemplateLiteralParserError(`TemplateLiteralParser: Index must point to open parens`);
    let count = 0;
    for (let scan = index; scan < value.length; scan++) {
      if (IsOpenParen(value, scan))
        count += 1;
      if (IsCloseParen(value, scan))
        count -= 1;
      if (count === 0)
        return [index, scan];
    }
    throw new TemplateLiteralParserError(`TemplateLiteralParser: Unclosed group parens in expression`);
  }
  function Range(pattern2, index) {
    for (let scan = index; scan < pattern2.length; scan++) {
      if (IsOpenParen(pattern2, scan))
        return [index, scan];
    }
    return [index, pattern2.length];
  }
  const expressions = [];
  for (let index = 0; index < pattern.length; index++) {
    if (IsOpenParen(pattern, index)) {
      const [start, end] = Group(pattern, index);
      const range = pattern.slice(start, end + 1);
      expressions.push(TemplateLiteralParse(range));
      index = end;
    } else {
      const [start, end] = Range(pattern, index);
      const range = pattern.slice(start, end);
      if (range.length > 0)
        expressions.push(TemplateLiteralParse(range));
      index = end - 1;
    }
  }
  return expressions.length === 0 ? { type: "const", const: "" } : expressions.length === 1 ? expressions[0] : { type: "and", expr: expressions };
}
function TemplateLiteralParse(pattern) {
  return IsGroup(pattern) ? TemplateLiteralParse(InGroup(pattern)) : IsPrecedenceOr(pattern) ? Or(pattern) : IsPrecedenceAnd(pattern) ? And(pattern) : { type: "const", const: Unescape(pattern) };
}
function TemplateLiteralParseExact(pattern) {
  return TemplateLiteralParse(pattern.slice(1, pattern.length - 1));
}
class TemplateLiteralFiniteError extends TypeBoxError {
}
function IsNumberExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "0" && expression.expr[1].type === "const" && expression.expr[1].const === "[1-9][0-9]*";
}
function IsBooleanExpression(expression) {
  return expression.type === "or" && expression.expr.length === 2 && expression.expr[0].type === "const" && expression.expr[0].const === "true" && expression.expr[1].type === "const" && expression.expr[1].const === "false";
}
function IsStringExpression(expression) {
  return expression.type === "const" && expression.const === ".*";
}
function IsTemplateLiteralExpressionFinite(expression) {
  return IsNumberExpression(expression) || IsStringExpression(expression) ? false : IsBooleanExpression(expression) ? true : expression.type === "and" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "or" ? expression.expr.every((expr) => IsTemplateLiteralExpressionFinite(expr)) : expression.type === "const" ? true : (() => {
    throw new TemplateLiteralFiniteError(`Unknown expression type`);
  })();
}
function IsTemplateLiteralFinite(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression);
}
class TemplateLiteralGenerateError extends TypeBoxError {
}
function* GenerateReduce(buffer) {
  if (buffer.length === 1)
    return yield* buffer[0];
  for (const left of buffer[0]) {
    for (const right of GenerateReduce(buffer.slice(1))) {
      yield `${left}${right}`;
    }
  }
}
function* GenerateAnd(expression) {
  return yield* GenerateReduce(expression.expr.map((expr) => [...TemplateLiteralExpressionGenerate(expr)]));
}
function* GenerateOr(expression) {
  for (const expr of expression.expr)
    yield* TemplateLiteralExpressionGenerate(expr);
}
function* GenerateConst(expression) {
  return yield expression.const;
}
function* TemplateLiteralExpressionGenerate(expression) {
  return expression.type === "and" ? yield* GenerateAnd(expression) : expression.type === "or" ? yield* GenerateOr(expression) : expression.type === "const" ? yield* GenerateConst(expression) : (() => {
    throw new TemplateLiteralGenerateError("Unknown expression");
  })();
}
function TemplateLiteralGenerate(schema) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  return IsTemplateLiteralExpressionFinite(expression) ? [...TemplateLiteralExpressionGenerate(expression)] : [];
}
function Literal(value, options) {
  return CreateType({
    [Kind$1]: "Literal",
    const: value,
    type: typeof value
  }, options);
}
function Boolean(options) {
  return CreateType({ [Kind$1]: "Boolean", type: "boolean" }, options);
}
function BigInt$1(options) {
  return CreateType({ [Kind$1]: "BigInt", type: "bigint" }, options);
}
function Number$1(options) {
  return CreateType({ [Kind$1]: "Number", type: "number" }, options);
}
function String$1(options) {
  return CreateType({ [Kind$1]: "String", type: "string" }, options);
}
function* FromUnion$g(syntax) {
  const trim = syntax.trim().replace(/"|'/g, "");
  return trim === "boolean" ? yield Boolean() : trim === "number" ? yield Number$1() : trim === "bigint" ? yield BigInt$1() : trim === "string" ? yield String$1() : yield (() => {
    const literals = trim.split("|").map((literal) => Literal(literal.trim()));
    return literals.length === 0 ? Never() : literals.length === 1 ? literals[0] : UnionEvaluated(literals);
  })();
}
function* FromTerminal(syntax) {
  if (syntax[1] !== "{") {
    const L = Literal("$");
    const R = FromSyntax(syntax.slice(1));
    return yield* [L, ...R];
  }
  for (let i = 2; i < syntax.length; i++) {
    if (syntax[i] === "}") {
      const L = FromUnion$g(syntax.slice(2, i));
      const R = FromSyntax(syntax.slice(i + 1));
      return yield* [...L, ...R];
    }
  }
  yield Literal(syntax);
}
function* FromSyntax(syntax) {
  for (let i = 0; i < syntax.length; i++) {
    if (syntax[i] === "$") {
      const L = Literal(syntax.slice(0, i));
      const R = FromTerminal(syntax.slice(i));
      return yield* [L, ...R];
    }
  }
  yield Literal(syntax);
}
function TemplateLiteralSyntax(syntax) {
  return [...FromSyntax(syntax)];
}
class TemplateLiteralPatternError extends TypeBoxError {
}
function Escape(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function Visit$a(schema, acc) {
  return IsTemplateLiteral$1(schema) ? schema.pattern.slice(1, schema.pattern.length - 1) : IsUnion$1(schema) ? `(${schema.anyOf.map((schema2) => Visit$a(schema2, acc)).join("|")})` : IsNumber$1(schema) ? `${acc}${PatternNumber}` : IsInteger$1(schema) ? `${acc}${PatternNumber}` : IsBigInt$1(schema) ? `${acc}${PatternNumber}` : IsString$1(schema) ? `${acc}${PatternString}` : IsLiteral$1(schema) ? `${acc}${Escape(schema.const.toString())}` : IsBoolean$1(schema) ? `${acc}${PatternBoolean}` : (() => {
    throw new TemplateLiteralPatternError(`Unexpected Kind '${schema[Kind$1]}'`);
  })();
}
function TemplateLiteralPattern(kinds) {
  return `^${kinds.map((schema) => Visit$a(schema, "")).join("")}$`;
}
function TemplateLiteralToUnion(schema) {
  const R = TemplateLiteralGenerate(schema);
  const L = R.map((S) => Literal(S));
  return UnionEvaluated(L);
}
function TemplateLiteral(unresolved, options) {
  const pattern = IsString$3(unresolved) ? TemplateLiteralPattern(TemplateLiteralSyntax(unresolved)) : TemplateLiteralPattern(unresolved);
  return CreateType({ [Kind$1]: "TemplateLiteral", type: "string", pattern }, options);
}
function FromTemplateLiteral$5(templateLiteral) {
  const keys = TemplateLiteralGenerate(templateLiteral);
  return keys.map((key) => key.toString());
}
function FromUnion$f(types) {
  const result = [];
  for (const type2 of types)
    result.push(...IndexPropertyKeys(type2));
  return result;
}
function FromLiteral$4(literalValue) {
  return [literalValue.toString()];
}
function IndexPropertyKeys(type2) {
  return [...new Set(IsTemplateLiteral$1(type2) ? FromTemplateLiteral$5(type2) : IsUnion$1(type2) ? FromUnion$f(type2.anyOf) : IsLiteral$1(type2) ? FromLiteral$4(type2.const) : IsNumber$1(type2) ? ["[number]"] : IsInteger$1(type2) ? ["[number]"] : [])];
}
function FromProperties$h(type2, properties, options) {
  const result = {};
  for (const K2 of Object.getOwnPropertyNames(properties)) {
    result[K2] = Index(type2, IndexPropertyKeys(properties[K2]), options);
  }
  return result;
}
function FromMappedResult$b(type2, mappedResult, options) {
  return FromProperties$h(type2, mappedResult.properties, options);
}
function IndexFromMappedResult(type2, mappedResult, options) {
  const properties = FromMappedResult$b(type2, mappedResult, options);
  return MappedResult(properties);
}
function FromRest$7(types, key) {
  return types.map((type2) => IndexFromPropertyKey(type2, key));
}
function FromIntersectRest(types) {
  return types.filter((type2) => !IsNever$1(type2));
}
function FromIntersect$e(types, key) {
  return IntersectEvaluated(FromIntersectRest(FromRest$7(types, key)));
}
function FromUnionRest(types) {
  return types.some((L) => IsNever$1(L)) ? [] : types;
}
function FromUnion$e(types, key) {
  return UnionEvaluated(FromUnionRest(FromRest$7(types, key)));
}
function FromTuple$b(types, key) {
  return key in types ? types[key] : key === "[number]" ? UnionEvaluated(types) : Never();
}
function FromArray$d(type2, key) {
  return key === "[number]" ? type2 : Never();
}
function FromProperty$1(properties, propertyKey) {
  return propertyKey in properties ? properties[propertyKey] : Never();
}
function IndexFromPropertyKey(type2, propertyKey) {
  return IsIntersect$1(type2) ? FromIntersect$e(type2.allOf, propertyKey) : IsUnion$1(type2) ? FromUnion$e(type2.anyOf, propertyKey) : IsTuple$1(type2) ? FromTuple$b(type2.items ?? [], propertyKey) : IsArray$1(type2) ? FromArray$d(type2.items, propertyKey) : IsObject$1(type2) ? FromProperty$1(type2.properties, propertyKey) : Never();
}
function IndexFromPropertyKeys(type2, propertyKeys) {
  return propertyKeys.map((propertyKey) => IndexFromPropertyKey(type2, propertyKey));
}
function FromSchema(type2, propertyKeys) {
  return UnionEvaluated(IndexFromPropertyKeys(type2, propertyKeys));
}
function Index(type2, key, options) {
  if (IsRef$1(type2) || IsRef$1(key)) {
    const error2 = `Index types using Ref parameters require both Type and Key to be of TSchema`;
    if (!IsSchema$1(type2) || !IsSchema$1(key))
      throw new TypeBoxError(error2);
    return Computed("Index", [type2, key]);
  }
  if (IsMappedResult$1(key))
    return IndexFromMappedResult(type2, key, options);
  if (IsMappedKey$1(key))
    return IndexFromMappedKey(type2, key, options);
  return CreateType(IsSchema$1(key) ? FromSchema(type2, IndexPropertyKeys(key)) : FromSchema(type2, key), options);
}
function MappedIndexPropertyKey(type2, key, options) {
  return { [key]: Index(type2, [key], Clone$1(options)) };
}
function MappedIndexPropertyKeys(type2, propertyKeys, options) {
  return propertyKeys.reduce((result, left) => {
    return { ...result, ...MappedIndexPropertyKey(type2, left, options) };
  }, {});
}
function MappedIndexProperties(type2, mappedKey, options) {
  return MappedIndexPropertyKeys(type2, mappedKey.keys, options);
}
function IndexFromMappedKey(type2, mappedKey, options) {
  const properties = MappedIndexProperties(type2, mappedKey, options);
  return MappedResult(properties);
}
function Iterator(items, options) {
  return CreateType({ [Kind$1]: "Iterator", type: "Iterator", items }, options);
}
function RequiredKeys(properties) {
  const keys = [];
  for (let key in properties) {
    if (!IsOptional$1(properties[key]))
      keys.push(key);
  }
  return keys;
}
function _Object(properties, options) {
  const required = RequiredKeys(properties);
  const schematic = required.length > 0 ? { [Kind$1]: "Object", type: "object", properties, required } : { [Kind$1]: "Object", type: "object", properties };
  return CreateType(schematic, options);
}
var Object$1 = _Object;
function Promise$1(item, options) {
  return CreateType({ [Kind$1]: "Promise", type: "Promise", item }, options);
}
function RemoveReadonly(schema) {
  return CreateType(Discard(schema, [ReadonlyKind]));
}
function AddReadonly(schema) {
  return CreateType({ ...schema, [ReadonlyKind]: "Readonly" });
}
function ReadonlyWithFlag(schema, F) {
  return F === false ? RemoveReadonly(schema) : AddReadonly(schema);
}
function Readonly(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult$1(schema) ? ReadonlyFromMappedResult(schema, F) : ReadonlyWithFlag(schema, F);
}
function FromProperties$g(K, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Readonly(K[K2], F);
  return Acc;
}
function FromMappedResult$a(R, F) {
  return FromProperties$g(R.properties, F);
}
function ReadonlyFromMappedResult(R, F) {
  const P = FromMappedResult$a(R, F);
  return MappedResult(P);
}
function Tuple(types, options) {
  return CreateType(types.length > 0 ? { [Kind$1]: "Tuple", type: "array", items: types, additionalItems: false, minItems: types.length, maxItems: types.length } : { [Kind$1]: "Tuple", type: "array", minItems: types.length, maxItems: types.length }, options);
}
function FromMappedResult$9(K, P) {
  return K in P ? FromSchemaType(K, P[K]) : MappedResult(P);
}
function MappedKeyToKnownMappedResultProperties(K) {
  return { [K]: Literal(K) };
}
function MappedKeyToUnknownMappedResultProperties(P) {
  const Acc = {};
  for (const L of P)
    Acc[L] = Literal(L);
  return Acc;
}
function MappedKeyToMappedResultProperties(K, P) {
  return SetIncludes(P, K) ? MappedKeyToKnownMappedResultProperties(K) : MappedKeyToUnknownMappedResultProperties(P);
}
function FromMappedKey$3(K, P) {
  const R = MappedKeyToMappedResultProperties(K, P);
  return FromMappedResult$9(K, R);
}
function FromRest$6(K, T) {
  return T.map((L) => FromSchemaType(K, L));
}
function FromProperties$f(K, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(T))
    Acc[K2] = FromSchemaType(K, T[K2]);
  return Acc;
}
function FromSchemaType(K, T) {
  const options = { ...T };
  return (
    // unevaluated modifier types
    IsOptional$1(T) ? Optional(FromSchemaType(K, Discard(T, [OptionalKind]))) : IsReadonly(T) ? Readonly(FromSchemaType(K, Discard(T, [ReadonlyKind]))) : (
      // unevaluated mapped types
      IsMappedResult$1(T) ? FromMappedResult$9(K, T.properties) : IsMappedKey$1(T) ? FromMappedKey$3(K, T.keys) : (
        // unevaluated types
        IsConstructor$1(T) ? Constructor(FromRest$6(K, T.parameters), FromSchemaType(K, T.returns), options) : IsFunction$1(T) ? Function$1(FromRest$6(K, T.parameters), FromSchemaType(K, T.returns), options) : IsAsyncIterator$1(T) ? AsyncIterator(FromSchemaType(K, T.items), options) : IsIterator$1(T) ? Iterator(FromSchemaType(K, T.items), options) : IsIntersect$1(T) ? Intersect$1(FromRest$6(K, T.allOf), options) : IsUnion$1(T) ? Union$1(FromRest$6(K, T.anyOf), options) : IsTuple$1(T) ? Tuple(FromRest$6(K, T.items ?? []), options) : IsObject$1(T) ? Object$1(FromProperties$f(K, T.properties), options) : IsArray$1(T) ? Array$1(FromSchemaType(K, T.items), options) : IsPromise$1(T) ? Promise$1(FromSchemaType(K, T.item), options) : T
      )
    )
  );
}
function MappedFunctionReturnType(K, T) {
  const Acc = {};
  for (const L of K)
    Acc[L] = FromSchemaType(L, T);
  return Acc;
}
function Mapped(key, map2, options) {
  const K = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const RT = map2({ [Kind$1]: "MappedKey", keys: K });
  const R = MappedFunctionReturnType(K, RT);
  return Object$1(R, options);
}
function RemoveOptional(schema) {
  return CreateType(Discard(schema, [OptionalKind]));
}
function AddOptional(schema) {
  return CreateType({ ...schema, [OptionalKind]: "Optional" });
}
function OptionalWithFlag(schema, F) {
  return F === false ? RemoveOptional(schema) : AddOptional(schema);
}
function Optional(schema, enable) {
  const F = enable ?? true;
  return IsMappedResult$1(schema) ? OptionalFromMappedResult(schema, F) : OptionalWithFlag(schema, F);
}
function FromProperties$e(P, F) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Optional(P[K2], F);
  return Acc;
}
function FromMappedResult$8(R, F) {
  return FromProperties$e(R.properties, F);
}
function OptionalFromMappedResult(R, F) {
  const P = FromMappedResult$8(R, F);
  return MappedResult(P);
}
function IntersectCreate(T, options = {}) {
  const allObjects = T.every((schema) => IsObject$1(schema));
  const clonedUnevaluatedProperties = IsSchema$1(options.unevaluatedProperties) ? { unevaluatedProperties: options.unevaluatedProperties } : {};
  return CreateType(options.unevaluatedProperties === false || IsSchema$1(options.unevaluatedProperties) || allObjects ? { ...clonedUnevaluatedProperties, [Kind$1]: "Intersect", type: "object", allOf: T } : { ...clonedUnevaluatedProperties, [Kind$1]: "Intersect", allOf: T }, options);
}
function IsIntersectOptional(types) {
  return types.every((left) => IsOptional$1(left));
}
function RemoveOptionalFromType(type2) {
  return Discard(type2, [OptionalKind]);
}
function RemoveOptionalFromRest(types) {
  return types.map((left) => IsOptional$1(left) ? RemoveOptionalFromType(left) : left);
}
function ResolveIntersect(types, options) {
  return IsIntersectOptional(types) ? Optional(IntersectCreate(RemoveOptionalFromRest(types), options)) : IntersectCreate(RemoveOptionalFromRest(types), options);
}
function IntersectEvaluated(types, options = {}) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform$1(schema)))
    throw new Error("Cannot intersect transform types");
  return ResolveIntersect(types, options);
}
function Intersect$1(types, options) {
  if (types.length === 1)
    return CreateType(types[0], options);
  if (types.length === 0)
    return Never(options);
  if (types.some((schema) => IsTransform$1(schema)))
    throw new Error("Cannot intersect transform types");
  return IntersectCreate(types, options);
}
function Ref(...args) {
  const [$ref, options] = typeof args[0] === "string" ? [args[0], args[1]] : [args[0].$id, args[1]];
  if (typeof $ref !== "string")
    throw new TypeBoxError("Ref: $ref must be a string");
  return CreateType({ [Kind$1]: "Ref", $ref }, options);
}
function FromComputed$4(target, parameters) {
  return Computed("Awaited", [Computed(target, parameters)]);
}
function FromRef$b($ref) {
  return Computed("Awaited", [Ref($ref)]);
}
function FromIntersect$d(types) {
  return Intersect$1(FromRest$5(types));
}
function FromUnion$d(types) {
  return Union$1(FromRest$5(types));
}
function FromPromise$5(type2) {
  return Awaited(type2);
}
function FromRest$5(types) {
  return types.map((type2) => Awaited(type2));
}
function Awaited(type2, options) {
  return CreateType(IsComputed$1(type2) ? FromComputed$4(type2.target, type2.parameters) : IsIntersect$1(type2) ? FromIntersect$d(type2.allOf) : IsUnion$1(type2) ? FromUnion$d(type2.anyOf) : IsPromise$1(type2) ? FromPromise$5(type2.item) : IsRef$1(type2) ? FromRef$b(type2.$ref) : type2, options);
}
function FromRest$4(types) {
  const result = [];
  for (const L of types)
    result.push(KeyOfPropertyKeys(L));
  return result;
}
function FromIntersect$c(types) {
  const propertyKeysArray = FromRest$4(types);
  const propertyKeys = SetUnionMany(propertyKeysArray);
  return propertyKeys;
}
function FromUnion$c(types) {
  const propertyKeysArray = FromRest$4(types);
  const propertyKeys = SetIntersectMany(propertyKeysArray);
  return propertyKeys;
}
function FromTuple$a(types) {
  return types.map((_, indexer) => indexer.toString());
}
function FromArray$c(_) {
  return ["[number]"];
}
function FromProperties$d(T) {
  return globalThis.Object.getOwnPropertyNames(T);
}
function FromPatternProperties(patternProperties) {
  if (!includePatternProperties)
    return [];
  const patternPropertyKeys = globalThis.Object.getOwnPropertyNames(patternProperties);
  return patternPropertyKeys.map((key) => {
    return key[0] === "^" && key[key.length - 1] === "$" ? key.slice(1, key.length - 1) : key;
  });
}
function KeyOfPropertyKeys(type2) {
  return IsIntersect$1(type2) ? FromIntersect$c(type2.allOf) : IsUnion$1(type2) ? FromUnion$c(type2.anyOf) : IsTuple$1(type2) ? FromTuple$a(type2.items ?? []) : IsArray$1(type2) ? FromArray$c(type2.items) : IsObject$1(type2) ? FromProperties$d(type2.properties) : IsRecord$1(type2) ? FromPatternProperties(type2.patternProperties) : [];
}
let includePatternProperties = false;
function KeyOfPattern(schema) {
  includePatternProperties = true;
  const keys = KeyOfPropertyKeys(schema);
  includePatternProperties = false;
  const pattern = keys.map((key) => `(${key})`);
  return `^(${pattern.join("|")})$`;
}
function FromComputed$3(target, parameters) {
  return Computed("KeyOf", [Computed(target, parameters)]);
}
function FromRef$a($ref) {
  return Computed("KeyOf", [Ref($ref)]);
}
function KeyOfFromType(type2, options) {
  const propertyKeys = KeyOfPropertyKeys(type2);
  const propertyKeyTypes = KeyOfPropertyKeysToRest(propertyKeys);
  const result = UnionEvaluated(propertyKeyTypes);
  return CreateType(result, options);
}
function KeyOfPropertyKeysToRest(propertyKeys) {
  return propertyKeys.map((L) => L === "[number]" ? Number$1() : Literal(L));
}
function KeyOf(type2, options) {
  return IsComputed$1(type2) ? FromComputed$3(type2.target, type2.parameters) : IsRef$1(type2) ? FromRef$a(type2.$ref) : IsMappedResult$1(type2) ? KeyOfFromMappedResult(type2, options) : KeyOfFromType(type2, options);
}
function FromProperties$c(properties, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = KeyOf(properties[K2], Clone$1(options));
  return result;
}
function FromMappedResult$7(mappedResult, options) {
  return FromProperties$c(mappedResult.properties, options);
}
function KeyOfFromMappedResult(mappedResult, options) {
  const properties = FromMappedResult$7(mappedResult, options);
  return MappedResult(properties);
}
function KeyOfPropertyEntries(schema) {
  const keys = KeyOfPropertyKeys(schema);
  const schemas = IndexFromPropertyKeys(schema, keys);
  return keys.map((_, index) => [keys[index], schemas[index]]);
}
function CompositeKeys(T) {
  const Acc = [];
  for (const L of T)
    Acc.push(...KeyOfPropertyKeys(L));
  return SetDistinct(Acc);
}
function FilterNever(T) {
  return T.filter((L) => !IsNever$1(L));
}
function CompositeProperty(T, K) {
  const Acc = [];
  for (const L of T)
    Acc.push(...IndexFromPropertyKeys(L, [K]));
  return FilterNever(Acc);
}
function CompositeProperties(T, K) {
  const Acc = {};
  for (const L of K) {
    Acc[L] = IntersectEvaluated(CompositeProperty(T, L));
  }
  return Acc;
}
function Composite(T, options) {
  const K = CompositeKeys(T);
  const P = CompositeProperties(T, K);
  const R = Object$1(P, options);
  return R;
}
function Date$1(options) {
  return CreateType({ [Kind$1]: "Date", type: "Date" }, options);
}
function Null(options) {
  return CreateType({ [Kind$1]: "Null", type: "null" }, options);
}
function Symbol$1(options) {
  return CreateType({ [Kind$1]: "Symbol", type: "symbol" }, options);
}
function Undefined(options) {
  return CreateType({ [Kind$1]: "Undefined", type: "undefined" }, options);
}
function Uint8Array$1(options) {
  return CreateType({ [Kind$1]: "Uint8Array", type: "Uint8Array" }, options);
}
function Unknown(options) {
  return CreateType({ [Kind$1]: "Unknown" }, options);
}
function FromArray$b(T) {
  return T.map((L) => FromValue$1(L, false));
}
function FromProperties$b(value) {
  const Acc = {};
  for (const K of globalThis.Object.getOwnPropertyNames(value))
    Acc[K] = Readonly(FromValue$1(value[K], false));
  return Acc;
}
function ConditionalReadonly(T, root) {
  return root === true ? T : Readonly(T);
}
function FromValue$1(value, root) {
  return IsAsyncIterator$3(value) ? ConditionalReadonly(Any(), root) : IsIterator$3(value) ? ConditionalReadonly(Any(), root) : IsArray$3(value) ? Readonly(Tuple(FromArray$b(value))) : IsUint8Array$3(value) ? Uint8Array$1() : IsDate$3(value) ? Date$1() : IsObject$3(value) ? ConditionalReadonly(Object$1(FromProperties$b(value)), root) : IsFunction$3(value) ? ConditionalReadonly(Function$1([], Unknown()), root) : IsUndefined$3(value) ? Undefined() : IsNull$3(value) ? Null() : IsSymbol$3(value) ? Symbol$1() : IsBigInt$3(value) ? BigInt$1() : IsNumber$3(value) ? Literal(value) : IsBoolean$3(value) ? Literal(value) : IsString$3(value) ? Literal(value) : Object$1({});
}
function Const(T, options) {
  return CreateType(FromValue$1(T, true), options);
}
function ConstructorParameters(schema, options) {
  return Tuple(schema.parameters, options);
}
function Enum(item, options) {
  if (IsUndefined$3(item))
    throw new Error("Enum undefined or empty");
  const values1 = globalThis.Object.getOwnPropertyNames(item).filter((key) => isNaN(key)).map((key) => item[key]);
  const values2 = [...new Set(values1)];
  const anyOf = values2.map((value) => Literal(value));
  return Union$1(anyOf, { ...options, [Hint]: "Enum" });
}
class ExtendsResolverError extends TypeBoxError {
}
var ExtendsResult;
(function(ExtendsResult2) {
  ExtendsResult2[ExtendsResult2["Union"] = 0] = "Union";
  ExtendsResult2[ExtendsResult2["True"] = 1] = "True";
  ExtendsResult2[ExtendsResult2["False"] = 2] = "False";
})(ExtendsResult || (ExtendsResult = {}));
function IntoBooleanResult(result) {
  return result === ExtendsResult.False ? result : ExtendsResult.True;
}
function Throw(message) {
  throw new ExtendsResolverError(message);
}
function IsStructuralRight(right) {
  return IsNever(right) || IsIntersect(right) || IsUnion(right) || IsUnknown(right) || IsAny(right);
}
function StructuralRight(left, right) {
  return IsNever(right) ? FromNeverRight() : IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsUnknown(right) ? FromUnknownRight() : IsAny(right) ? FromAnyRight() : Throw("StructuralRight");
}
function FromAnyRight(left, right) {
  return ExtendsResult.True;
}
function FromAny$3(left, right) {
  return IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) && right.anyOf.some((schema) => IsAny(schema) || IsUnknown(schema)) ? ExtendsResult.True : IsUnion(right) ? ExtendsResult.Union : IsUnknown(right) ? ExtendsResult.True : IsAny(right) ? ExtendsResult.True : ExtendsResult.Union;
}
function FromArrayRight(left, right) {
  return IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : IsNever(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromArray$a(left, right) {
  return IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : !IsArray(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromAsyncIterator$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsAsyncIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromBigInt$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsBigInt(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBooleanRight(left, right) {
  return IsLiteralBoolean(left) ? ExtendsResult.True : IsBoolean(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromBoolean$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsBoolean(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromConstructor$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsConstructor(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit$9(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.returns, right.returns));
}
function FromDate$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsDate(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromFunction$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsFunction(right) ? ExtendsResult.False : left.parameters.length > right.parameters.length ? ExtendsResult.False : !left.parameters.every((schema, index) => IntoBooleanResult(Visit$9(right.parameters[index], schema)) === ExtendsResult.True) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.returns, right.returns));
}
function FromIntegerRight(left, right) {
  return IsLiteral(left) && IsNumber$3(left.const) ? ExtendsResult.True : IsNumber(left) || IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromInteger$3(left, right) {
  return IsInteger(right) || IsNumber(right) ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : ExtendsResult.False;
}
function FromIntersectRight(left, right) {
  return right.allOf.every((schema) => Visit$9(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIntersect$b(left, right) {
  return left.allOf.some((schema) => Visit$9(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromIterator$5(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : !IsIterator(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.items, right.items));
}
function FromLiteral$3(left, right) {
  return IsLiteral(right) && right.const === left.const ? ExtendsResult.True : IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsString(right) ? FromStringRight(left) : IsNumber(right) ? FromNumberRight(left) : IsInteger(right) ? FromIntegerRight(left) : IsBoolean(right) ? FromBooleanRight(left) : ExtendsResult.False;
}
function FromNeverRight(left, right) {
  return ExtendsResult.False;
}
function FromNever$3(left, right) {
  return ExtendsResult.True;
}
function UnwrapTNot(schema) {
  let [current, depth] = [schema, 0];
  while (true) {
    if (!IsNot(current))
      break;
    current = current.not;
    depth += 1;
  }
  return depth % 2 === 0 ? current : Unknown();
}
function FromNot$6(left, right) {
  return IsNot(left) ? Visit$9(UnwrapTNot(left), right) : IsNot(right) ? Visit$9(left, UnwrapTNot(right)) : Throw("Invalid fallthrough for Not");
}
function FromNull$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsNull(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumberRight(left, right) {
  return IsLiteralNumber(left) ? ExtendsResult.True : IsNumber(left) || IsInteger(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromNumber$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsInteger(right) || IsNumber(right) ? ExtendsResult.True : ExtendsResult.False;
}
function IsObjectPropertyCount(schema, count) {
  return Object.getOwnPropertyNames(schema.properties).length === count;
}
function IsObjectStringLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectSymbolLike(schema) {
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "description" in schema.properties && IsUnion(schema.properties.description) && schema.properties.description.anyOf.length === 2 && (IsString(schema.properties.description.anyOf[0]) && IsUndefined(schema.properties.description.anyOf[1]) || IsString(schema.properties.description.anyOf[1]) && IsUndefined(schema.properties.description.anyOf[0]));
}
function IsObjectNumberLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBooleanLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectBigIntLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectDateLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectUint8ArrayLike(schema) {
  return IsObjectArrayLike(schema);
}
function IsObjectFunctionLike(schema) {
  const length = Number$1();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectConstructorLike(schema) {
  return IsObjectPropertyCount(schema, 0);
}
function IsObjectArrayLike(schema) {
  const length = Number$1();
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "length" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["length"], length)) === ExtendsResult.True;
}
function IsObjectPromiseLike(schema) {
  const then = Function$1([Any()], Any());
  return IsObjectPropertyCount(schema, 0) || IsObjectPropertyCount(schema, 1) && "then" in schema.properties && IntoBooleanResult(Visit$9(schema.properties["then"], then)) === ExtendsResult.True;
}
function Property(left, right) {
  return Visit$9(left, right) === ExtendsResult.False ? ExtendsResult.False : IsOptional(left) && !IsOptional(right) ? ExtendsResult.False : ExtendsResult.True;
}
function FromObjectRight(left, right) {
  return IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : IsNever(left) || IsLiteralString(left) && IsObjectStringLike(right) || IsLiteralNumber(left) && IsObjectNumberLike(right) || IsLiteralBoolean(left) && IsObjectBooleanLike(right) || IsSymbol(left) && IsObjectSymbolLike(right) || IsBigInt(left) && IsObjectBigIntLike(right) || IsString(left) && IsObjectStringLike(right) || IsSymbol(left) && IsObjectSymbolLike(right) || IsNumber(left) && IsObjectNumberLike(right) || IsInteger(left) && IsObjectNumberLike(right) || IsBoolean(left) && IsObjectBooleanLike(right) || IsUint8Array(left) && IsObjectUint8ArrayLike(right) || IsDate(left) && IsObjectDateLike(right) || IsConstructor(left) && IsObjectConstructorLike(right) || IsFunction(left) && IsObjectFunctionLike(right) ? ExtendsResult.True : IsRecord(left) && IsString(RecordKey(left)) ? (() => {
    return right[Hint] === "Record" ? ExtendsResult.True : ExtendsResult.False;
  })() : IsRecord(left) && IsNumber(RecordKey(left)) ? (() => {
    return IsObjectPropertyCount(right, 0) ? ExtendsResult.True : ExtendsResult.False;
  })() : ExtendsResult.False;
}
function FromObject$e(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : !IsObject(right) ? ExtendsResult.False : (() => {
    for (const key of Object.getOwnPropertyNames(right.properties)) {
      if (!(key in left.properties) && !IsOptional(right.properties[key])) {
        return ExtendsResult.False;
      }
      if (IsOptional(right.properties[key])) {
        return ExtendsResult.True;
      }
      if (Property(left.properties[key], right.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })();
}
function FromPromise$4(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) && IsObjectPromiseLike(right) ? ExtendsResult.True : !IsPromise(right) ? ExtendsResult.False : IntoBooleanResult(Visit$9(left.item, right.item));
}
function RecordKey(schema) {
  return PatternNumberExact in schema.patternProperties ? Number$1() : PatternStringExact in schema.patternProperties ? String$1() : Throw("Unknown record key pattern");
}
function RecordValue(schema) {
  return PatternNumberExact in schema.patternProperties ? schema.patternProperties[PatternNumberExact] : PatternStringExact in schema.patternProperties ? schema.patternProperties[PatternStringExact] : Throw("Unable to get record value schema");
}
function FromRecordRight(left, right) {
  const [Key, Value] = [RecordKey(right), RecordValue(right)];
  return IsLiteralString(left) && IsNumber(Key) && IntoBooleanResult(Visit$9(left, Value)) === ExtendsResult.True ? ExtendsResult.True : IsUint8Array(left) && IsNumber(Key) ? Visit$9(left, Value) : IsString(left) && IsNumber(Key) ? Visit$9(left, Value) : IsArray(left) && IsNumber(Key) ? Visit$9(left, Value) : IsObject(left) ? (() => {
    for (const key of Object.getOwnPropertyNames(left.properties)) {
      if (Property(Value, left.properties[key]) === ExtendsResult.False) {
        return ExtendsResult.False;
      }
    }
    return ExtendsResult.True;
  })() : ExtendsResult.False;
}
function FromRecord$9(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : !IsRecord(right) ? ExtendsResult.False : Visit$9(RecordValue(left), RecordValue(right));
}
function FromRegExp$3(left, right) {
  const L = IsRegExp(left) ? String$1() : left;
  const R = IsRegExp(right) ? String$1() : right;
  return Visit$9(L, R);
}
function FromStringRight(left, right) {
  return IsLiteral(left) && IsString$3(left.const) ? ExtendsResult.True : IsString(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromString$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsString(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromSymbol$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsSymbol(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromTemplateLiteral$4(left, right) {
  return IsTemplateLiteral(left) ? Visit$9(TemplateLiteralToUnion(left), right) : IsTemplateLiteral(right) ? Visit$9(left, TemplateLiteralToUnion(right)) : Throw("Invalid fallthrough for TemplateLiteral");
}
function IsArrayOfTuple(left, right) {
  return IsArray(right) && left.items !== void 0 && left.items.every((schema) => Visit$9(schema, right.items) === ExtendsResult.True);
}
function FromTupleRight(left, right) {
  return IsNever(left) ? ExtendsResult.True : IsUnknown(left) ? ExtendsResult.False : IsAny(left) ? ExtendsResult.Union : ExtendsResult.False;
}
function FromTuple$9(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) && IsObjectArrayLike(right) ? ExtendsResult.True : IsArray(right) && IsArrayOfTuple(left, right) ? ExtendsResult.True : !IsTuple(right) ? ExtendsResult.False : IsUndefined$3(left.items) && !IsUndefined$3(right.items) || !IsUndefined$3(left.items) && IsUndefined$3(right.items) ? ExtendsResult.False : IsUndefined$3(left.items) && !IsUndefined$3(right.items) ? ExtendsResult.True : left.items.every((schema, index) => Visit$9(schema, right.items[index]) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUint8Array$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsUint8Array(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUndefined$3(left, right) {
  return IsStructuralRight(right) ? StructuralRight(left, right) : IsObject(right) ? FromObjectRight(left, right) : IsRecord(right) ? FromRecordRight(left, right) : IsVoid(right) ? FromVoidRight(left) : IsUndefined(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnionRight(left, right) {
  return right.anyOf.some((schema) => Visit$9(left, schema) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnion$b(left, right) {
  return left.anyOf.every((schema) => Visit$9(schema, right) === ExtendsResult.True) ? ExtendsResult.True : ExtendsResult.False;
}
function FromUnknownRight(left, right) {
  return ExtendsResult.True;
}
function FromUnknown$3(left, right) {
  return IsNever(right) ? FromNeverRight() : IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsAny(right) ? FromAnyRight() : IsString(right) ? FromStringRight(left) : IsNumber(right) ? FromNumberRight(left) : IsInteger(right) ? FromIntegerRight(left) : IsBoolean(right) ? FromBooleanRight(left) : IsArray(right) ? FromArrayRight(left) : IsTuple(right) ? FromTupleRight(left) : IsObject(right) ? FromObjectRight(left, right) : IsUnknown(right) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoidRight(left, right) {
  return IsUndefined(left) ? ExtendsResult.True : IsUndefined(left) ? ExtendsResult.True : ExtendsResult.False;
}
function FromVoid$3(left, right) {
  return IsIntersect(right) ? FromIntersectRight(left, right) : IsUnion(right) ? FromUnionRight(left, right) : IsUnknown(right) ? FromUnknownRight() : IsAny(right) ? FromAnyRight() : IsObject(right) ? FromObjectRight(left, right) : IsVoid(right) ? ExtendsResult.True : ExtendsResult.False;
}
function Visit$9(left, right) {
  return (
    // resolvable
    IsTemplateLiteral(left) || IsTemplateLiteral(right) ? FromTemplateLiteral$4(left, right) : IsRegExp(left) || IsRegExp(right) ? FromRegExp$3(left, right) : IsNot(left) || IsNot(right) ? FromNot$6(left, right) : (
      // standard
      IsAny(left) ? FromAny$3(left, right) : IsArray(left) ? FromArray$a(left, right) : IsBigInt(left) ? FromBigInt$3(left, right) : IsBoolean(left) ? FromBoolean$3(left, right) : IsAsyncIterator(left) ? FromAsyncIterator$5(left, right) : IsConstructor(left) ? FromConstructor$5(left, right) : IsDate(left) ? FromDate$5(left, right) : IsFunction(left) ? FromFunction$5(left, right) : IsInteger(left) ? FromInteger$3(left, right) : IsIntersect(left) ? FromIntersect$b(left, right) : IsIterator(left) ? FromIterator$5(left, right) : IsLiteral(left) ? FromLiteral$3(left, right) : IsNever(left) ? FromNever$3() : IsNull(left) ? FromNull$3(left, right) : IsNumber(left) ? FromNumber$3(left, right) : IsObject(left) ? FromObject$e(left, right) : IsRecord(left) ? FromRecord$9(left, right) : IsString(left) ? FromString$3(left, right) : IsSymbol(left) ? FromSymbol$3(left, right) : IsTuple(left) ? FromTuple$9(left, right) : IsPromise(left) ? FromPromise$4(left, right) : IsUint8Array(left) ? FromUint8Array$3(left, right) : IsUndefined(left) ? FromUndefined$3(left, right) : IsUnion(left) ? FromUnion$b(left, right) : IsUnknown(left) ? FromUnknown$3(left, right) : IsVoid(left) ? FromVoid$3(left, right) : Throw(`Unknown left type operand '${left[Kind$1]}'`)
    )
  );
}
function ExtendsCheck(left, right) {
  return Visit$9(left, right);
}
function FromProperties$a(P, Right, True, False, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extends(P[K2], Right, True, False, Clone$1(options));
  return Acc;
}
function FromMappedResult$6(Left, Right, True, False, options) {
  return FromProperties$a(Left.properties, Right, True, False, options);
}
function ExtendsFromMappedResult(Left, Right, True, False, options) {
  const P = FromMappedResult$6(Left, Right, True, False, options);
  return MappedResult(P);
}
function ExtendsResolve(left, right, trueType, falseType) {
  const R = ExtendsCheck(left, right);
  return R === ExtendsResult.Union ? Union$1([trueType, falseType]) : R === ExtendsResult.True ? trueType : falseType;
}
function Extends(L, R, T, F, options) {
  return IsMappedResult$1(L) ? ExtendsFromMappedResult(L, R, T, F, options) : IsMappedKey$1(L) ? CreateType(ExtendsFromMappedKey(L, R, T, F, options)) : CreateType(ExtendsResolve(L, R, T, F), options);
}
function FromPropertyKey$2(K, U, L, R, options) {
  return {
    [K]: Extends(Literal(K), U, L, R, Clone$1(options))
  };
}
function FromPropertyKeys$2(K, U, L, R, options) {
  return K.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey$2(LK, U, L, R, options) };
  }, {});
}
function FromMappedKey$2(K, U, L, R, options) {
  return FromPropertyKeys$2(K.keys, U, L, R, options);
}
function ExtendsFromMappedKey(T, U, L, R, options) {
  const P = FromMappedKey$2(T, U, L, R, options);
  return MappedResult(P);
}
function Intersect(schema) {
  return schema.allOf.every((schema2) => ExtendsUndefinedCheck(schema2));
}
function Union(schema) {
  return schema.anyOf.some((schema2) => ExtendsUndefinedCheck(schema2));
}
function Not$1(schema) {
  return !ExtendsUndefinedCheck(schema.not);
}
function ExtendsUndefinedCheck(schema) {
  return schema[Kind$1] === "Intersect" ? Intersect(schema) : schema[Kind$1] === "Union" ? Union(schema) : schema[Kind$1] === "Not" ? Not$1(schema) : schema[Kind$1] === "Undefined" ? true : false;
}
function ExcludeFromTemplateLiteral(L, R) {
  return Exclude(TemplateLiteralToUnion(L), R);
}
function ExcludeRest(L, R) {
  const excluded = L.filter((inner) => ExtendsCheck(inner, R) === ExtendsResult.False);
  return excluded.length === 1 ? excluded[0] : Union$1(excluded);
}
function Exclude(L, R, options = {}) {
  if (IsTemplateLiteral$1(L))
    return CreateType(ExcludeFromTemplateLiteral(L, R), options);
  if (IsMappedResult$1(L))
    return CreateType(ExcludeFromMappedResult(L, R), options);
  return CreateType(IsUnion$1(L) ? ExcludeRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? Never() : L, options);
}
function FromProperties$9(P, U) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Exclude(P[K2], U);
  return Acc;
}
function FromMappedResult$5(R, T) {
  return FromProperties$9(R.properties, T);
}
function ExcludeFromMappedResult(R, T) {
  const P = FromMappedResult$5(R, T);
  return MappedResult(P);
}
function ExtractFromTemplateLiteral(L, R) {
  return Extract(TemplateLiteralToUnion(L), R);
}
function ExtractRest(L, R) {
  const extracted = L.filter((inner) => ExtendsCheck(inner, R) !== ExtendsResult.False);
  return extracted.length === 1 ? extracted[0] : Union$1(extracted);
}
function Extract(L, R, options) {
  if (IsTemplateLiteral$1(L))
    return CreateType(ExtractFromTemplateLiteral(L, R), options);
  if (IsMappedResult$1(L))
    return CreateType(ExtractFromMappedResult(L, R), options);
  return CreateType(IsUnion$1(L) ? ExtractRest(L.anyOf, R) : ExtendsCheck(L, R) !== ExtendsResult.False ? L : Never(), options);
}
function FromProperties$8(P, T) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Extract(P[K2], T);
  return Acc;
}
function FromMappedResult$4(R, T) {
  return FromProperties$8(R.properties, T);
}
function ExtractFromMappedResult(R, T) {
  const P = FromMappedResult$4(R, T);
  return MappedResult(P);
}
function InstanceType(schema, options) {
  return CreateType(schema.returns, options);
}
function Integer(options) {
  return CreateType({ [Kind$1]: "Integer", type: "integer" }, options);
}
function MappedIntrinsicPropertyKey(K, M, options) {
  return {
    [K]: Intrinsic(Literal(K), M, Clone$1(options))
  };
}
function MappedIntrinsicPropertyKeys(K, M, options) {
  const result = K.reduce((Acc, L) => {
    return { ...Acc, ...MappedIntrinsicPropertyKey(L, M, options) };
  }, {});
  return result;
}
function MappedIntrinsicProperties(T, M, options) {
  return MappedIntrinsicPropertyKeys(T["keys"], M, options);
}
function IntrinsicFromMappedKey(T, M, options) {
  const P = MappedIntrinsicProperties(T, M, options);
  return MappedResult(P);
}
function ApplyUncapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toLowerCase(), rest].join("");
}
function ApplyCapitalize(value) {
  const [first, rest] = [value.slice(0, 1), value.slice(1)];
  return [first.toUpperCase(), rest].join("");
}
function ApplyUppercase(value) {
  return value.toUpperCase();
}
function ApplyLowercase(value) {
  return value.toLowerCase();
}
function FromTemplateLiteral$3(schema, mode, options) {
  const expression = TemplateLiteralParseExact(schema.pattern);
  const finite = IsTemplateLiteralExpressionFinite(expression);
  if (!finite)
    return { ...schema, pattern: FromLiteralValue(schema.pattern, mode) };
  const strings = [...TemplateLiteralExpressionGenerate(expression)];
  const literals = strings.map((value) => Literal(value));
  const mapped = FromRest$3(literals, mode);
  const union = Union$1(mapped);
  return TemplateLiteral([union], options);
}
function FromLiteralValue(value, mode) {
  return typeof value === "string" ? mode === "Uncapitalize" ? ApplyUncapitalize(value) : mode === "Capitalize" ? ApplyCapitalize(value) : mode === "Uppercase" ? ApplyUppercase(value) : mode === "Lowercase" ? ApplyLowercase(value) : value : value.toString();
}
function FromRest$3(T, M) {
  return T.map((L) => Intrinsic(L, M));
}
function Intrinsic(schema, mode, options = {}) {
  return (
    // Intrinsic-Mapped-Inference
    IsMappedKey$1(schema) ? IntrinsicFromMappedKey(schema, mode, options) : (
      // Standard-Inference
      IsTemplateLiteral$1(schema) ? FromTemplateLiteral$3(schema, mode, options) : IsUnion$1(schema) ? Union$1(FromRest$3(schema.anyOf, mode), options) : IsLiteral$1(schema) ? Literal(FromLiteralValue(schema.const, mode), options) : (
        // Default Type
        CreateType(schema, options)
      )
    )
  );
}
function Capitalize(T, options = {}) {
  return Intrinsic(T, "Capitalize", options);
}
function Lowercase(T, options = {}) {
  return Intrinsic(T, "Lowercase", options);
}
function Uncapitalize(T, options = {}) {
  return Intrinsic(T, "Uncapitalize", options);
}
function Uppercase(T, options = {}) {
  return Intrinsic(T, "Uppercase", options);
}
function FromProperties$7(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Omit(properties[K2], propertyKeys, Clone$1(options));
  return result;
}
function FromMappedResult$3(mappedResult, propertyKeys, options) {
  return FromProperties$7(mappedResult.properties, propertyKeys, options);
}
function OmitFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult$3(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
function FromIntersect$a(types, propertyKeys) {
  return types.map((type2) => OmitResolve(type2, propertyKeys));
}
function FromUnion$a(types, propertyKeys) {
  return types.map((type2) => OmitResolve(type2, propertyKeys));
}
function FromProperty(properties, key) {
  const { [key]: _, ...R } = properties;
  return R;
}
function FromProperties$6(properties, propertyKeys) {
  return propertyKeys.reduce((T, K2) => FromProperty(T, K2), properties);
}
function FromObject$d(properties, propertyKeys) {
  const options = Discard(properties, [TransformKind, "$id", "required", "properties"]);
  const omittedProperties = FromProperties$6(properties["properties"], propertyKeys);
  return Object$1(omittedProperties, options);
}
function UnionFromPropertyKeys$1(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue$1(key) ? [...result2, Literal(key)] : result2, []);
  return Union$1(result);
}
function OmitResolve(properties, propertyKeys) {
  return IsIntersect$1(properties) ? Intersect$1(FromIntersect$a(properties.allOf, propertyKeys)) : IsUnion$1(properties) ? Union$1(FromUnion$a(properties.anyOf, propertyKeys)) : IsObject$1(properties) ? FromObject$d(properties, propertyKeys) : Object$1({});
}
function Omit(type2, key, options) {
  const typeKey = IsArray$3(key) ? UnionFromPropertyKeys$1(key) : key;
  const propertyKeys = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef$1(type2);
  const isKeyRef = IsRef$1(key);
  return IsMappedResult$1(type2) ? OmitFromMappedResult(type2, propertyKeys, options) : IsMappedKey$1(key) ? OmitFromMappedKey(type2, key, options) : isTypeRef && isKeyRef ? Computed("Omit", [type2, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Omit", [type2, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Omit", [type2, typeKey], options) : CreateType({ ...OmitResolve(type2, propertyKeys), ...options });
}
function FromPropertyKey$1(type2, key, options) {
  return { [key]: Omit(type2, [key], Clone$1(options)) };
}
function FromPropertyKeys$1(type2, propertyKeys, options) {
  return propertyKeys.reduce((Acc, LK) => {
    return { ...Acc, ...FromPropertyKey$1(type2, LK, options) };
  }, {});
}
function FromMappedKey$1(type2, mappedKey, options) {
  return FromPropertyKeys$1(type2, mappedKey.keys, options);
}
function OmitFromMappedKey(type2, mappedKey, options) {
  const properties = FromMappedKey$1(type2, mappedKey, options);
  return MappedResult(properties);
}
function FromProperties$5(properties, propertyKeys, options) {
  const result = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(properties))
    result[K2] = Pick(properties[K2], propertyKeys, Clone$1(options));
  return result;
}
function FromMappedResult$2(mappedResult, propertyKeys, options) {
  return FromProperties$5(mappedResult.properties, propertyKeys, options);
}
function PickFromMappedResult(mappedResult, propertyKeys, options) {
  const properties = FromMappedResult$2(mappedResult, propertyKeys, options);
  return MappedResult(properties);
}
function FromIntersect$9(types, propertyKeys) {
  return types.map((type2) => PickResolve(type2, propertyKeys));
}
function FromUnion$9(types, propertyKeys) {
  return types.map((type2) => PickResolve(type2, propertyKeys));
}
function FromProperties$4(properties, propertyKeys) {
  const result = {};
  for (const K2 of propertyKeys)
    if (K2 in properties)
      result[K2] = properties[K2];
  return result;
}
function FromObject$c(T, K) {
  const options = Discard(T, [TransformKind, "$id", "required", "properties"]);
  const properties = FromProperties$4(T["properties"], K);
  return Object$1(properties, options);
}
function UnionFromPropertyKeys(propertyKeys) {
  const result = propertyKeys.reduce((result2, key) => IsLiteralValue$1(key) ? [...result2, Literal(key)] : result2, []);
  return Union$1(result);
}
function PickResolve(properties, propertyKeys) {
  return IsIntersect$1(properties) ? Intersect$1(FromIntersect$9(properties.allOf, propertyKeys)) : IsUnion$1(properties) ? Union$1(FromUnion$9(properties.anyOf, propertyKeys)) : IsObject$1(properties) ? FromObject$c(properties, propertyKeys) : Object$1({});
}
function Pick(type2, key, options) {
  const typeKey = IsArray$3(key) ? UnionFromPropertyKeys(key) : key;
  const propertyKeys = IsSchema$1(key) ? IndexPropertyKeys(key) : key;
  const isTypeRef = IsRef$1(type2);
  const isKeyRef = IsRef$1(key);
  return IsMappedResult$1(type2) ? PickFromMappedResult(type2, propertyKeys, options) : IsMappedKey$1(key) ? PickFromMappedKey(type2, key, options) : isTypeRef && isKeyRef ? Computed("Pick", [type2, typeKey], options) : !isTypeRef && isKeyRef ? Computed("Pick", [type2, typeKey], options) : isTypeRef && !isKeyRef ? Computed("Pick", [type2, typeKey], options) : CreateType({ ...PickResolve(type2, propertyKeys), ...options });
}
function FromPropertyKey(type2, key, options) {
  return {
    [key]: Pick(type2, [key], Clone$1(options))
  };
}
function FromPropertyKeys(type2, propertyKeys, options) {
  return propertyKeys.reduce((result, leftKey) => {
    return { ...result, ...FromPropertyKey(type2, leftKey, options) };
  }, {});
}
function FromMappedKey(type2, mappedKey, options) {
  return FromPropertyKeys(type2, mappedKey.keys, options);
}
function PickFromMappedKey(type2, mappedKey, options) {
  const properties = FromMappedKey(type2, mappedKey, options);
  return MappedResult(properties);
}
function FromComputed$2(target, parameters) {
  return Computed("Partial", [Computed(target, parameters)]);
}
function FromRef$9($ref) {
  return Computed("Partial", [Ref($ref)]);
}
function FromProperties$3(properties) {
  const partialProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    partialProperties[K] = Optional(properties[K]);
  return partialProperties;
}
function FromObject$b(T) {
  const options = Discard(T, [TransformKind, "$id", "required", "properties"]);
  const properties = FromProperties$3(T["properties"]);
  return Object$1(properties, options);
}
function FromRest$2(types) {
  return types.map((type2) => PartialResolve(type2));
}
function PartialResolve(type2) {
  return IsComputed$1(type2) ? FromComputed$2(type2.target, type2.parameters) : IsRef$1(type2) ? FromRef$9(type2.$ref) : IsIntersect$1(type2) ? Intersect$1(FromRest$2(type2.allOf)) : IsUnion$1(type2) ? Union$1(FromRest$2(type2.anyOf)) : IsObject$1(type2) ? FromObject$b(type2) : Object$1({});
}
function Partial(type2, options) {
  if (IsMappedResult$1(type2)) {
    return PartialFromMappedResult(type2, options);
  } else {
    return CreateType({ ...PartialResolve(type2), ...options });
  }
}
function FromProperties$2(K, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(K))
    Acc[K2] = Partial(K[K2], Clone$1(options));
  return Acc;
}
function FromMappedResult$1(R, options) {
  return FromProperties$2(R.properties, options);
}
function PartialFromMappedResult(R, options) {
  const P = FromMappedResult$1(R, options);
  return MappedResult(P);
}
function RecordCreateFromPattern(pattern, T, options) {
  return CreateType({ [Kind$1]: "Record", type: "object", patternProperties: { [pattern]: T } }, options);
}
function RecordCreateFromKeys(K, T, options) {
  const result = {};
  for (const K2 of K)
    result[K2] = T;
  return Object$1(result, { ...options, [Hint]: "Record" });
}
function FromTemplateLiteralKey(K, T, options) {
  return IsTemplateLiteralFinite(K) ? RecordCreateFromKeys(IndexPropertyKeys(K), T, options) : RecordCreateFromPattern(K.pattern, T, options);
}
function FromUnionKey(key, type2, options) {
  return RecordCreateFromKeys(IndexPropertyKeys(Union$1(key)), type2, options);
}
function FromLiteralKey(key, type2, options) {
  return RecordCreateFromKeys([key.toString()], type2, options);
}
function FromRegExpKey(key, type2, options) {
  return RecordCreateFromPattern(key.source, type2, options);
}
function FromStringKey(key, type2, options) {
  const pattern = IsUndefined$3(key.pattern) ? PatternStringExact : key.pattern;
  return RecordCreateFromPattern(pattern, type2, options);
}
function FromAnyKey(_, type2, options) {
  return RecordCreateFromPattern(PatternStringExact, type2, options);
}
function FromNeverKey(_key, type2, options) {
  return RecordCreateFromPattern(PatternNeverExact, type2, options);
}
function FromIntegerKey(_key, type2, options) {
  return RecordCreateFromPattern(PatternNumberExact, type2, options);
}
function FromNumberKey(_, type2, options) {
  return RecordCreateFromPattern(PatternNumberExact, type2, options);
}
function Record(key, type2, options = {}) {
  return IsComputed$1(type2) ? Computed("Record", [key, Computed(type2.target, type2.parameters)], options) : IsComputed$1(key) ? Computed("Record", [Computed(type2.target, type2.parameters), type2], options) : IsRef$1(key) ? Computed("Record", [Ref(key.$ref), type2]) : IsUnion$1(key) ? FromUnionKey(key.anyOf, type2, options) : IsTemplateLiteral$1(key) ? FromTemplateLiteralKey(key, type2, options) : IsLiteral$1(key) ? FromLiteralKey(key.const, type2, options) : IsInteger$1(key) ? FromIntegerKey(key, type2, options) : IsNumber$1(key) ? FromNumberKey(key, type2, options) : IsRegExp$1(key) ? FromRegExpKey(key, type2, options) : IsString$1(key) ? FromStringKey(key, type2, options) : IsAny$1(key) ? FromAnyKey(key, type2, options) : IsNever$1(key) ? FromNeverKey(key, type2, options) : Never(options);
}
function FromComputed$1(target, parameters) {
  return Computed("Required", [Computed(target, parameters)]);
}
function FromRef$8($ref) {
  return Computed("Required", [Ref($ref)]);
}
function FromProperties$1(properties) {
  const requiredProperties = {};
  for (const K of globalThis.Object.getOwnPropertyNames(properties))
    requiredProperties[K] = Discard(properties[K], [OptionalKind]);
  return requiredProperties;
}
function FromObject$a(type2) {
  const options = Discard(type2, [TransformKind, "$id", "required", "properties"]);
  const properties = FromProperties$1(type2["properties"]);
  return Object$1(properties, options);
}
function FromRest$1(types) {
  return types.map((type2) => RequiredResolve(type2));
}
function RequiredResolve(type2) {
  return IsComputed$1(type2) ? FromComputed$1(type2.target, type2.parameters) : IsRef$1(type2) ? FromRef$8(type2.$ref) : IsIntersect$1(type2) ? Intersect$1(FromRest$1(type2.allOf)) : IsUnion$1(type2) ? Union$1(FromRest$1(type2.anyOf)) : IsObject$1(type2) ? FromObject$a(type2) : Object$1({});
}
function Required(type2, options) {
  if (IsMappedResult$1(type2)) {
    return RequiredFromMappedResult(type2, options);
  } else {
    return CreateType({ ...RequiredResolve(type2), ...options });
  }
}
function FromProperties(P, options) {
  const Acc = {};
  for (const K2 of globalThis.Object.getOwnPropertyNames(P))
    Acc[K2] = Required(P[K2], options);
  return Acc;
}
function FromMappedResult(R, options) {
  return FromProperties(R.properties, options);
}
function RequiredFromMappedResult(R, options) {
  const P = FromMappedResult(R, options);
  return MappedResult(P);
}
function DerefParameters(moduleProperties, types) {
  return types.map((type2) => {
    return IsRef$1(type2) ? Deref$1(moduleProperties, type2.$ref) : FromType(moduleProperties, type2);
  });
}
function Deref$1(moduleProperties, ref) {
  return ref in moduleProperties ? IsRef$1(moduleProperties[ref]) ? Deref$1(moduleProperties, moduleProperties[ref].$ref) : FromType(moduleProperties, moduleProperties[ref]) : Never();
}
function FromAwaited(parameters) {
  return Awaited(parameters[0]);
}
function FromIndex(parameters) {
  return Index(parameters[0], parameters[1]);
}
function FromKeyOf(parameters) {
  return KeyOf(parameters[0]);
}
function FromPartial(parameters) {
  return Partial(parameters[0]);
}
function FromOmit(parameters) {
  return Omit(parameters[0], parameters[1]);
}
function FromPick(parameters) {
  return Pick(parameters[0], parameters[1]);
}
function FromRecord$8(parameters) {
  return Record(parameters[0], parameters[1]);
}
function FromRequired(parameters) {
  return Required(parameters[0]);
}
function FromComputed(moduleProperties, target, parameters) {
  const dereferenced = DerefParameters(moduleProperties, parameters);
  return target === "Awaited" ? FromAwaited(dereferenced) : target === "Index" ? FromIndex(dereferenced) : target === "KeyOf" ? FromKeyOf(dereferenced) : target === "Partial" ? FromPartial(dereferenced) : target === "Omit" ? FromOmit(dereferenced) : target === "Pick" ? FromPick(dereferenced) : target === "Record" ? FromRecord$8(dereferenced) : target === "Required" ? FromRequired(dereferenced) : Never();
}
function FromObject$9(moduleProperties, properties) {
  return Object$1(globalThis.Object.keys(properties).reduce((result, key) => {
    return { ...result, [key]: FromType(moduleProperties, properties[key]) };
  }, {}));
}
function FromConstructor$4(moduleProperties, parameters, instanceType) {
  return Constructor(FromRest(moduleProperties, parameters), FromType(moduleProperties, instanceType));
}
function FromFunction$4(moduleProperties, parameters, returnType) {
  return Function$1(FromRest(moduleProperties, parameters), FromType(moduleProperties, returnType));
}
function FromTuple$8(moduleProperties, types) {
  return Tuple(FromRest(moduleProperties, types));
}
function FromIntersect$8(moduleProperties, types) {
  return Intersect$1(FromRest(moduleProperties, types));
}
function FromUnion$8(moduleProperties, types) {
  return Union$1(FromRest(moduleProperties, types));
}
function FromArray$9(moduleProperties, type2) {
  return Array$1(FromType(moduleProperties, type2));
}
function FromAsyncIterator$4(moduleProperties, type2) {
  return AsyncIterator(FromType(moduleProperties, type2));
}
function FromIterator$4(moduleProperties, type2) {
  return Iterator(FromType(moduleProperties, type2));
}
function FromRest(moduleProperties, types) {
  return types.map((type2) => FromType(moduleProperties, type2));
}
function FromType(moduleProperties, type2) {
  return (
    // Modifier Unwrap - Reapplied via CreateType Options
    IsOptional$1(type2) ? CreateType(FromType(moduleProperties, Discard(type2, [OptionalKind])), type2) : IsReadonly(type2) ? CreateType(FromType(moduleProperties, Discard(type2, [ReadonlyKind])), type2) : (
      // Traveral
      IsArray$1(type2) ? CreateType(FromArray$9(moduleProperties, type2.items), type2) : IsAsyncIterator$1(type2) ? CreateType(FromAsyncIterator$4(moduleProperties, type2.items), type2) : IsComputed$1(type2) ? CreateType(FromComputed(moduleProperties, type2.target, type2.parameters)) : IsConstructor$1(type2) ? CreateType(FromConstructor$4(moduleProperties, type2.parameters, type2.returns), type2) : IsFunction$1(type2) ? CreateType(FromFunction$4(moduleProperties, type2.parameters, type2.returns), type2) : IsIntersect$1(type2) ? CreateType(FromIntersect$8(moduleProperties, type2.allOf), type2) : IsIterator$1(type2) ? CreateType(FromIterator$4(moduleProperties, type2.items), type2) : IsObject$1(type2) ? CreateType(FromObject$9(moduleProperties, type2.properties), type2) : IsTuple$1(type2) ? CreateType(FromTuple$8(moduleProperties, type2.items || []), type2) : IsUnion$1(type2) ? CreateType(FromUnion$8(moduleProperties, type2.anyOf), type2) : type2
    )
  );
}
function ComputeType(moduleProperties, key) {
  return key in moduleProperties ? FromType(moduleProperties, moduleProperties[key]) : Never();
}
function ComputeModuleProperties(moduleProperties) {
  return globalThis.Object.getOwnPropertyNames(moduleProperties).reduce((result, key) => {
    return { ...result, [key]: ComputeType(moduleProperties, key) };
  }, {});
}
class TModule {
  constructor($defs) {
    const computed = ComputeModuleProperties($defs);
    const identified = this.WithIdentifiers(computed);
    this.$defs = identified;
  }
  /** `[Json]` Imports a Type by Key. */
  Import(key, options) {
    const $defs = { ...this.$defs, [key]: CreateType(this.$defs[key], options) };
    return CreateType({ [Kind$1]: "Import", $defs, $ref: key });
  }
  // prettier-ignore
  WithIdentifiers($defs) {
    return globalThis.Object.getOwnPropertyNames($defs).reduce((result, key) => {
      return { ...result, [key]: { ...$defs[key], $id: key } };
    }, {});
  }
}
function Module(properties) {
  return new TModule(properties);
}
function Not(type2, options) {
  return CreateType({ [Kind$1]: "Not", not: type2 }, options);
}
function Parameters(schema, options) {
  return Tuple(schema.parameters, options);
}
function ReadonlyOptional(schema) {
  return Readonly(Optional(schema));
}
let Ordinal = 0;
function Recursive(callback, options = {}) {
  if (IsUndefined$3(options.$id))
    options.$id = `T${Ordinal++}`;
  const thisType = CloneType(callback({ [Kind$1]: "This", $ref: `${options.$id}` }));
  thisType.$id = options.$id;
  return CreateType({ [Hint]: "Recursive", ...thisType }, options);
}
function RegExp$1(unresolved, options) {
  const expr = IsString$3(unresolved) ? new globalThis.RegExp(unresolved) : unresolved;
  return CreateType({ [Kind$1]: "RegExp", type: "RegExp", source: expr.source, flags: expr.flags }, options);
}
function RestResolve(T) {
  return IsIntersect$1(T) ? T.allOf : IsUnion$1(T) ? T.anyOf : IsTuple$1(T) ? T.items ?? [] : [];
}
function Rest(T) {
  return RestResolve(T);
}
function ReturnType(schema, options) {
  return CreateType(schema.returns, options);
}
class TransformDecodeBuilder {
  constructor(schema) {
    this.schema = schema;
  }
  Decode(decode2) {
    return new TransformEncodeBuilder(this.schema, decode2);
  }
}
class TransformEncodeBuilder {
  constructor(schema, decode2) {
    this.schema = schema;
    this.decode = decode2;
  }
  EncodeTransform(encode, schema) {
    const Encode2 = (value) => schema[TransformKind].Encode(encode(value));
    const Decode2 = (value) => this.decode(schema[TransformKind].Decode(value));
    const Codec = { Encode: Encode2, Decode: Decode2 };
    return { ...schema, [TransformKind]: Codec };
  }
  EncodeSchema(encode, schema) {
    const Codec = { Decode: this.decode, Encode: encode };
    return { ...schema, [TransformKind]: Codec };
  }
  Encode(encode) {
    return IsTransform$1(this.schema) ? this.EncodeTransform(encode, this.schema) : this.EncodeSchema(encode, this.schema);
  }
}
function Transform(schema) {
  return new TransformDecodeBuilder(schema);
}
function Unsafe(options = {}) {
  return CreateType({ [Kind$1]: options[Kind$1] ?? "Unsafe" }, options);
}
function Void(options) {
  return CreateType({ [Kind$1]: "Void", type: "void" }, options);
}
const TypeBuilder = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Any,
  Array: Array$1,
  AsyncIterator,
  Awaited,
  BigInt: BigInt$1,
  Boolean,
  Capitalize,
  Composite,
  Const,
  Constructor,
  ConstructorParameters,
  Date: Date$1,
  Enum,
  Exclude,
  Extends,
  Extract,
  Function: Function$1,
  Index,
  InstanceType,
  Integer,
  Intersect: Intersect$1,
  Iterator,
  KeyOf,
  Literal,
  Lowercase,
  Mapped,
  Module,
  Never,
  Not,
  Null,
  Number: Number$1,
  Object: Object$1,
  Omit,
  Optional,
  Parameters,
  Partial,
  Pick,
  Promise: Promise$1,
  Readonly,
  ReadonlyOptional,
  Record,
  Recursive,
  Ref,
  RegExp: RegExp$1,
  Required,
  Rest,
  ReturnType,
  String: String$1,
  Symbol: Symbol$1,
  TemplateLiteral,
  Transform,
  Tuple,
  Uint8Array: Uint8Array$1,
  Uncapitalize,
  Undefined,
  Union: Union$1,
  Unknown,
  Unsafe,
  Uppercase,
  Void
}, Symbol.toStringTag, { value: "Module" }));
const Type = TypeBuilder;
class TypeSystemDuplicateTypeKind extends TypeBoxError {
  constructor(kind) {
    super(`Duplicate type kind '${kind}' detected`);
  }
}
class TypeSystemDuplicateFormat extends TypeBoxError {
  constructor(kind) {
    super(`Duplicate string format '${kind}' detected`);
  }
}
var TypeSystem;
(function(TypeSystem2) {
  function Type2(kind, check) {
    if (Has(kind))
      throw new TypeSystemDuplicateTypeKind(kind);
    Set$1(kind, check);
    return (options = {}) => Unsafe({ ...options, [Kind$1]: kind });
  }
  TypeSystem2.Type = Type2;
  function Format(format, check) {
    if (Has$1(format))
      throw new TypeSystemDuplicateFormat(format);
    Set$2(format, check);
    return format;
  }
  TypeSystem2.Format = Format;
})(TypeSystem || (TypeSystem = {}));
function DefaultErrorFunction(error2) {
  switch (error2.errorType) {
    case ValueErrorType.ArrayContains:
      return "Expected array to contain at least one matching value";
    case ValueErrorType.ArrayMaxContains:
      return `Expected array to contain no more than ${error2.schema.maxContains} matching values`;
    case ValueErrorType.ArrayMinContains:
      return `Expected array to contain at least ${error2.schema.minContains} matching values`;
    case ValueErrorType.ArrayMaxItems:
      return `Expected array length to be less or equal to ${error2.schema.maxItems}`;
    case ValueErrorType.ArrayMinItems:
      return `Expected array length to be greater or equal to ${error2.schema.minItems}`;
    case ValueErrorType.ArrayUniqueItems:
      return "Expected array elements to be unique";
    case ValueErrorType.Array:
      return "Expected array";
    case ValueErrorType.AsyncIterator:
      return "Expected AsyncIterator";
    case ValueErrorType.BigIntExclusiveMaximum:
      return `Expected bigint to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.BigIntExclusiveMinimum:
      return `Expected bigint to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.BigIntMaximum:
      return `Expected bigint to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.BigIntMinimum:
      return `Expected bigint to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.BigIntMultipleOf:
      return `Expected bigint to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.BigInt:
      return "Expected bigint";
    case ValueErrorType.Boolean:
      return "Expected boolean";
    case ValueErrorType.DateExclusiveMinimumTimestamp:
      return `Expected Date timestamp to be greater than ${error2.schema.exclusiveMinimumTimestamp}`;
    case ValueErrorType.DateExclusiveMaximumTimestamp:
      return `Expected Date timestamp to be less than ${error2.schema.exclusiveMaximumTimestamp}`;
    case ValueErrorType.DateMinimumTimestamp:
      return `Expected Date timestamp to be greater or equal to ${error2.schema.minimumTimestamp}`;
    case ValueErrorType.DateMaximumTimestamp:
      return `Expected Date timestamp to be less or equal to ${error2.schema.maximumTimestamp}`;
    case ValueErrorType.DateMultipleOfTimestamp:
      return `Expected Date timestamp to be a multiple of ${error2.schema.multipleOfTimestamp}`;
    case ValueErrorType.Date:
      return "Expected Date";
    case ValueErrorType.Function:
      return "Expected function";
    case ValueErrorType.IntegerExclusiveMaximum:
      return `Expected integer to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.IntegerExclusiveMinimum:
      return `Expected integer to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.IntegerMaximum:
      return `Expected integer to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.IntegerMinimum:
      return `Expected integer to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.IntegerMultipleOf:
      return `Expected integer to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.Integer:
      return "Expected integer";
    case ValueErrorType.IntersectUnevaluatedProperties:
      return "Unexpected property";
    case ValueErrorType.Intersect:
      return "Expected all values to match";
    case ValueErrorType.Iterator:
      return "Expected Iterator";
    case ValueErrorType.Literal:
      return `Expected ${typeof error2.schema.const === "string" ? `'${error2.schema.const}'` : error2.schema.const}`;
    case ValueErrorType.Never:
      return "Never";
    case ValueErrorType.Not:
      return "Value should not match";
    case ValueErrorType.Null:
      return "Expected null";
    case ValueErrorType.NumberExclusiveMaximum:
      return `Expected number to be less than ${error2.schema.exclusiveMaximum}`;
    case ValueErrorType.NumberExclusiveMinimum:
      return `Expected number to be greater than ${error2.schema.exclusiveMinimum}`;
    case ValueErrorType.NumberMaximum:
      return `Expected number to be less or equal to ${error2.schema.maximum}`;
    case ValueErrorType.NumberMinimum:
      return `Expected number to be greater or equal to ${error2.schema.minimum}`;
    case ValueErrorType.NumberMultipleOf:
      return `Expected number to be a multiple of ${error2.schema.multipleOf}`;
    case ValueErrorType.Number:
      return "Expected number";
    case ValueErrorType.Object:
      return "Expected object";
    case ValueErrorType.ObjectAdditionalProperties:
      return "Unexpected property";
    case ValueErrorType.ObjectMaxProperties:
      return `Expected object to have no more than ${error2.schema.maxProperties} properties`;
    case ValueErrorType.ObjectMinProperties:
      return `Expected object to have at least ${error2.schema.minProperties} properties`;
    case ValueErrorType.ObjectRequiredProperty:
      return "Expected required property";
    case ValueErrorType.Promise:
      return "Expected Promise";
    case ValueErrorType.RegExp:
      return "Expected string to match regular expression";
    case ValueErrorType.StringFormatUnknown:
      return `Unknown format '${error2.schema.format}'`;
    case ValueErrorType.StringFormat:
      return `Expected string to match '${error2.schema.format}' format`;
    case ValueErrorType.StringMaxLength:
      return `Expected string length less or equal to ${error2.schema.maxLength}`;
    case ValueErrorType.StringMinLength:
      return `Expected string length greater or equal to ${error2.schema.minLength}`;
    case ValueErrorType.StringPattern:
      return `Expected string to match '${error2.schema.pattern}'`;
    case ValueErrorType.String:
      return "Expected string";
    case ValueErrorType.Symbol:
      return "Expected symbol";
    case ValueErrorType.TupleLength:
      return `Expected tuple to have ${error2.schema.maxItems || 0} elements`;
    case ValueErrorType.Tuple:
      return "Expected tuple";
    case ValueErrorType.Uint8ArrayMaxByteLength:
      return `Expected byte length less or equal to ${error2.schema.maxByteLength}`;
    case ValueErrorType.Uint8ArrayMinByteLength:
      return `Expected byte length greater or equal to ${error2.schema.minByteLength}`;
    case ValueErrorType.Uint8Array:
      return "Expected Uint8Array";
    case ValueErrorType.Undefined:
      return "Expected undefined";
    case ValueErrorType.Union:
      return "Expected union value";
    case ValueErrorType.Void:
      return "Expected void";
    case ValueErrorType.Kind:
      return `Expected kind '${error2.schema[Kind$1]}'`;
    default:
      return "Unknown error type";
  }
}
let errorFunction = DefaultErrorFunction;
function GetErrorFunction() {
  return errorFunction;
}
class TypeDereferenceError extends TypeBoxError {
  constructor(schema) {
    super(`Unable to dereference schema with $id '${schema.$ref}'`);
    this.schema = schema;
  }
}
function Resolve(schema, references) {
  const target = references.find((target2) => target2.$id === schema.$ref);
  if (target === void 0)
    throw new TypeDereferenceError(schema);
  return Deref(target, references);
}
function Pushref(schema, references) {
  if (!IsString$2(schema.$id) || references.some((target) => target.$id === schema.$id))
    return references;
  references.push(schema);
  return references;
}
function Deref(schema, references) {
  return schema[Kind$1] === "This" || schema[Kind$1] === "Ref" ? Resolve(schema, references) : schema;
}
class ValueHashError extends TypeBoxError {
  constructor(value) {
    super(`Unable to hash value`);
    this.value = value;
  }
}
var ByteMarker;
(function(ByteMarker2) {
  ByteMarker2[ByteMarker2["Undefined"] = 0] = "Undefined";
  ByteMarker2[ByteMarker2["Null"] = 1] = "Null";
  ByteMarker2[ByteMarker2["Boolean"] = 2] = "Boolean";
  ByteMarker2[ByteMarker2["Number"] = 3] = "Number";
  ByteMarker2[ByteMarker2["String"] = 4] = "String";
  ByteMarker2[ByteMarker2["Object"] = 5] = "Object";
  ByteMarker2[ByteMarker2["Array"] = 6] = "Array";
  ByteMarker2[ByteMarker2["Date"] = 7] = "Date";
  ByteMarker2[ByteMarker2["Uint8Array"] = 8] = "Uint8Array";
  ByteMarker2[ByteMarker2["Symbol"] = 9] = "Symbol";
  ByteMarker2[ByteMarker2["BigInt"] = 10] = "BigInt";
})(ByteMarker || (ByteMarker = {}));
let Accumulator = BigInt("14695981039346656037");
const [Prime, Size] = [BigInt("1099511628211"), BigInt(
  "18446744073709551616"
  /* 2 ^ 64 */
)];
const Bytes = Array.from({ length: 256 }).map((_, i) => BigInt(i));
const F64 = new Float64Array(1);
const F64In = new DataView(F64.buffer);
const F64Out = new Uint8Array(F64.buffer);
function* NumberToBytes(value) {
  const byteCount = value === 0 ? 1 : Math.ceil(Math.floor(Math.log2(value) + 1) / 8);
  for (let i = 0; i < byteCount; i++) {
    yield value >> 8 * (byteCount - 1 - i) & 255;
  }
}
function ArrayType(value) {
  FNV1A64(ByteMarker.Array);
  for (const item of value) {
    Visit$8(item);
  }
}
function BooleanType(value) {
  FNV1A64(ByteMarker.Boolean);
  FNV1A64(value ? 1 : 0);
}
function BigIntType(value) {
  FNV1A64(ByteMarker.BigInt);
  F64In.setBigInt64(0, value);
  for (const byte2 of F64Out) {
    FNV1A64(byte2);
  }
}
function DateType(value) {
  FNV1A64(ByteMarker.Date);
  Visit$8(value.getTime());
}
function NullType(value) {
  FNV1A64(ByteMarker.Null);
}
function NumberType(value) {
  FNV1A64(ByteMarker.Number);
  F64In.setFloat64(0, value);
  for (const byte2 of F64Out) {
    FNV1A64(byte2);
  }
}
function ObjectType(value) {
  FNV1A64(ByteMarker.Object);
  for (const key of globalThis.Object.getOwnPropertyNames(value).sort()) {
    Visit$8(key);
    Visit$8(value[key]);
  }
}
function StringType(value) {
  FNV1A64(ByteMarker.String);
  for (let i = 0; i < value.length; i++) {
    for (const byte2 of NumberToBytes(value.charCodeAt(i))) {
      FNV1A64(byte2);
    }
  }
}
function SymbolType(value) {
  FNV1A64(ByteMarker.Symbol);
  Visit$8(value.description);
}
function Uint8ArrayType(value) {
  FNV1A64(ByteMarker.Uint8Array);
  for (let i = 0; i < value.length; i++) {
    FNV1A64(value[i]);
  }
}
function UndefinedType(value) {
  return FNV1A64(ByteMarker.Undefined);
}
function Visit$8(value) {
  if (IsArray$2(value))
    return ArrayType(value);
  if (IsBoolean$2(value))
    return BooleanType(value);
  if (IsBigInt$2(value))
    return BigIntType(value);
  if (IsDate$2(value))
    return DateType(value);
  if (IsNull$2(value))
    return NullType();
  if (IsNumber$2(value))
    return NumberType(value);
  if (IsObject$2(value))
    return ObjectType(value);
  if (IsString$2(value))
    return StringType(value);
  if (IsSymbol$2(value))
    return SymbolType(value);
  if (IsUint8Array$2(value))
    return Uint8ArrayType(value);
  if (IsUndefined$2(value))
    return UndefinedType();
  throw new ValueHashError(value);
}
function FNV1A64(byte2) {
  Accumulator = Accumulator ^ Bytes[byte2];
  Accumulator = Accumulator * Prime % Size;
}
function Hash(value) {
  Accumulator = BigInt("14695981039346656037");
  Visit$8(value);
  return Accumulator;
}
class ValueCheckUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super(`Unknown type`);
    this.schema = schema;
  }
}
function IsAnyOrUnknown(schema) {
  return schema[Kind$1] === "Any" || schema[Kind$1] === "Unknown";
}
function IsDefined$1(value) {
  return value !== void 0;
}
function FromAny$2(schema, references, value) {
  return true;
}
function FromArray$8(schema, references, value) {
  if (!IsArray$2(value))
    return false;
  if (IsDefined$1(schema.minItems) && !(value.length >= schema.minItems)) {
    return false;
  }
  if (IsDefined$1(schema.maxItems) && !(value.length <= schema.maxItems)) {
    return false;
  }
  if (!value.every((value2) => Visit$7(schema.items, references, value2))) {
    return false;
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = /* @__PURE__ */ new Set();
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    return false;
  }
  if (!(IsDefined$1(schema.contains) || IsNumber$2(schema.minContains) || IsNumber$2(schema.maxContains))) {
    return true;
  }
  const containsSchema = IsDefined$1(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2) => Visit$7(containsSchema, references, value2) ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    return false;
  }
  if (IsNumber$2(schema.minContains) && containsCount < schema.minContains) {
    return false;
  }
  if (IsNumber$2(schema.maxContains) && containsCount > schema.maxContains) {
    return false;
  }
  return true;
}
function FromAsyncIterator$3(schema, references, value) {
  return IsAsyncIterator$2(value);
}
function FromBigInt$2(schema, references, value) {
  if (!IsBigInt$2(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    return false;
  }
  return true;
}
function FromBoolean$2(schema, references, value) {
  return IsBoolean$2(value);
}
function FromConstructor$3(schema, references, value) {
  return Visit$7(schema.returns, references, value.prototype);
}
function FromDate$4(schema, references, value) {
  if (!IsDate$2(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    return false;
  }
  return true;
}
function FromFunction$3(schema, references, value) {
  return IsFunction$2(value);
}
function FromImport$6(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$7(target, [...references, ...definitions], value);
}
function FromInteger$2(schema, references, value) {
  if (!IsInteger$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromIntersect$7(schema, references, value) {
  const check1 = schema.allOf.every((schema2) => Visit$7(schema2, references, value));
  if (schema.unevaluatedProperties === false) {
    const keyPattern = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyPattern.test(key));
    return check1 && check2;
  } else if (IsSchema$1(schema.unevaluatedProperties)) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    const check2 = Object.getOwnPropertyNames(value).every((key) => keyCheck.test(key) || Visit$7(schema.unevaluatedProperties, references, value[key]));
    return check1 && check2;
  } else {
    return check1;
  }
}
function FromIterator$3(schema, references, value) {
  return IsIterator$2(value);
}
function FromLiteral$2(schema, references, value) {
  return value === schema.const;
}
function FromNever$2(schema, references, value) {
  return false;
}
function FromNot$5(schema, references, value) {
  return !Visit$7(schema.not, references, value);
}
function FromNull$2(schema, references, value) {
  return IsNull$2(value);
}
function FromNumber$2(schema, references, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return false;
  if (IsDefined$1(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    return false;
  }
  if (IsDefined$1(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    return false;
  }
  if (IsDefined$1(schema.minimum) && !(value >= schema.minimum)) {
    return false;
  }
  if (IsDefined$1(schema.maximum) && !(value <= schema.maximum)) {
    return false;
  }
  if (IsDefined$1(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    return false;
  }
  return true;
}
function FromObject$8(schema, references, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return false;
  if (IsDefined$1(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined$1(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      if (!Visit$7(property, references, value[knownKey])) {
        return false;
      }
      if ((ExtendsUndefinedCheck(property) || IsAnyOrUnknown(property)) && !(knownKey in value)) {
        return false;
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey) && !Visit$7(property, references, value[knownKey])) {
        return false;
      }
    }
  }
  if (schema.additionalProperties === false) {
    const valueKeys = Object.getOwnPropertyNames(value);
    if (schema.required && schema.required.length === knownKeys.length && valueKeys.length === knownKeys.length) {
      return true;
    } else {
      return valueKeys.every((valueKey) => knownKeys.includes(valueKey));
    }
  } else if (typeof schema.additionalProperties === "object") {
    const valueKeys = Object.getOwnPropertyNames(value);
    return valueKeys.every((key) => knownKeys.includes(key) || Visit$7(schema.additionalProperties, references, value[key]));
  } else {
    return true;
  }
}
function FromPromise$3(schema, references, value) {
  return IsPromise$2(value);
}
function FromRecord$7(schema, references, value) {
  if (!TypeSystemPolicy.IsRecordLike(value)) {
    return false;
  }
  if (IsDefined$1(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    return false;
  }
  if (IsDefined$1(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    return false;
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex2 = new RegExp(patternKey);
  const check1 = Object.entries(value).every(([key, value2]) => {
    return regex2.test(key) ? Visit$7(patternSchema, references, value2) : true;
  });
  const check2 = typeof schema.additionalProperties === "object" ? Object.entries(value).every(([key, value2]) => {
    return !regex2.test(key) ? Visit$7(schema.additionalProperties, references, value2) : true;
  }) : true;
  const check3 = schema.additionalProperties === false ? Object.getOwnPropertyNames(value).every((key) => {
    return regex2.test(key);
  }) : true;
  return check1 && check2 && check3;
}
function FromRef$7(schema, references, value) {
  return Visit$7(Deref(schema, references), references, value);
}
function FromRegExp$2(schema, references, value) {
  const regex2 = new RegExp(schema.source, schema.flags);
  if (IsDefined$1(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined$1(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  return regex2.test(value);
}
function FromString$2(schema, references, value) {
  if (!IsString$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.minLength)) {
    if (!(value.length >= schema.minLength))
      return false;
  }
  if (IsDefined$1(schema.maxLength)) {
    if (!(value.length <= schema.maxLength))
      return false;
  }
  if (IsDefined$1(schema.pattern)) {
    const regex2 = new RegExp(schema.pattern);
    if (!regex2.test(value))
      return false;
  }
  if (IsDefined$1(schema.format)) {
    if (!Has$1(schema.format))
      return false;
    const func = Get$1(schema.format);
    return func(value);
  }
  return true;
}
function FromSymbol$2(schema, references, value) {
  return IsSymbol$2(value);
}
function FromTemplateLiteral$2(schema, references, value) {
  return IsString$2(value) && new RegExp(schema.pattern).test(value);
}
function FromThis$7(schema, references, value) {
  return Visit$7(Deref(schema, references), references, value);
}
function FromTuple$7(schema, references, value) {
  if (!IsArray$2(value)) {
    return false;
  }
  if (schema.items === void 0 && !(value.length === 0)) {
    return false;
  }
  if (!(value.length === schema.maxItems)) {
    return false;
  }
  if (!schema.items) {
    return true;
  }
  for (let i = 0; i < schema.items.length; i++) {
    if (!Visit$7(schema.items[i], references, value[i]))
      return false;
  }
  return true;
}
function FromUndefined$2(schema, references, value) {
  return IsUndefined$2(value);
}
function FromUnion$7(schema, references, value) {
  return schema.anyOf.some((inner) => Visit$7(inner, references, value));
}
function FromUint8Array$2(schema, references, value) {
  if (!IsUint8Array$2(value)) {
    return false;
  }
  if (IsDefined$1(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    return false;
  }
  if (IsDefined$1(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    return false;
  }
  return true;
}
function FromUnknown$2(schema, references, value) {
  return true;
}
function FromVoid$2(schema, references, value) {
  return TypeSystemPolicy.IsVoidLike(value);
}
function FromKind$2(schema, references, value) {
  if (!Has(schema[Kind$1]))
    return false;
  const func = Get(schema[Kind$1]);
  return func(schema, value);
}
function Visit$7(schema, references, value) {
  const references_ = IsDefined$1(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return FromAny$2();
    case "Array":
      return FromArray$8(schema_, references_, value);
    case "AsyncIterator":
      return FromAsyncIterator$3(schema_, references_, value);
    case "BigInt":
      return FromBigInt$2(schema_, references_, value);
    case "Boolean":
      return FromBoolean$2(schema_, references_, value);
    case "Constructor":
      return FromConstructor$3(schema_, references_, value);
    case "Date":
      return FromDate$4(schema_, references_, value);
    case "Function":
      return FromFunction$3(schema_, references_, value);
    case "Import":
      return FromImport$6(schema_, references_, value);
    case "Integer":
      return FromInteger$2(schema_, references_, value);
    case "Intersect":
      return FromIntersect$7(schema_, references_, value);
    case "Iterator":
      return FromIterator$3(schema_, references_, value);
    case "Literal":
      return FromLiteral$2(schema_, references_, value);
    case "Never":
      return FromNever$2();
    case "Not":
      return FromNot$5(schema_, references_, value);
    case "Null":
      return FromNull$2(schema_, references_, value);
    case "Number":
      return FromNumber$2(schema_, references_, value);
    case "Object":
      return FromObject$8(schema_, references_, value);
    case "Promise":
      return FromPromise$3(schema_, references_, value);
    case "Record":
      return FromRecord$7(schema_, references_, value);
    case "Ref":
      return FromRef$7(schema_, references_, value);
    case "RegExp":
      return FromRegExp$2(schema_, references_, value);
    case "String":
      return FromString$2(schema_, references_, value);
    case "Symbol":
      return FromSymbol$2(schema_, references_, value);
    case "TemplateLiteral":
      return FromTemplateLiteral$2(schema_, references_, value);
    case "This":
      return FromThis$7(schema_, references_, value);
    case "Tuple":
      return FromTuple$7(schema_, references_, value);
    case "Undefined":
      return FromUndefined$2(schema_, references_, value);
    case "Union":
      return FromUnion$7(schema_, references_, value);
    case "Uint8Array":
      return FromUint8Array$2(schema_, references_, value);
    case "Unknown":
      return FromUnknown$2();
    case "Void":
      return FromVoid$2(schema_, references_, value);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueCheckUnknownTypeError(schema_);
      return FromKind$2(schema_, references_, value);
  }
}
function Check(...args) {
  return args.length === 3 ? Visit$7(args[0], args[1], args[2]) : Visit$7(args[0], [], args[1]);
}
var ValueErrorType;
(function(ValueErrorType2) {
  ValueErrorType2[ValueErrorType2["ArrayContains"] = 0] = "ArrayContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxContains"] = 1] = "ArrayMaxContains";
  ValueErrorType2[ValueErrorType2["ArrayMaxItems"] = 2] = "ArrayMaxItems";
  ValueErrorType2[ValueErrorType2["ArrayMinContains"] = 3] = "ArrayMinContains";
  ValueErrorType2[ValueErrorType2["ArrayMinItems"] = 4] = "ArrayMinItems";
  ValueErrorType2[ValueErrorType2["ArrayUniqueItems"] = 5] = "ArrayUniqueItems";
  ValueErrorType2[ValueErrorType2["Array"] = 6] = "Array";
  ValueErrorType2[ValueErrorType2["AsyncIterator"] = 7] = "AsyncIterator";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMaximum"] = 8] = "BigIntExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["BigIntExclusiveMinimum"] = 9] = "BigIntExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMaximum"] = 10] = "BigIntMaximum";
  ValueErrorType2[ValueErrorType2["BigIntMinimum"] = 11] = "BigIntMinimum";
  ValueErrorType2[ValueErrorType2["BigIntMultipleOf"] = 12] = "BigIntMultipleOf";
  ValueErrorType2[ValueErrorType2["BigInt"] = 13] = "BigInt";
  ValueErrorType2[ValueErrorType2["Boolean"] = 14] = "Boolean";
  ValueErrorType2[ValueErrorType2["DateExclusiveMaximumTimestamp"] = 15] = "DateExclusiveMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateExclusiveMinimumTimestamp"] = 16] = "DateExclusiveMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMaximumTimestamp"] = 17] = "DateMaximumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMinimumTimestamp"] = 18] = "DateMinimumTimestamp";
  ValueErrorType2[ValueErrorType2["DateMultipleOfTimestamp"] = 19] = "DateMultipleOfTimestamp";
  ValueErrorType2[ValueErrorType2["Date"] = 20] = "Date";
  ValueErrorType2[ValueErrorType2["Function"] = 21] = "Function";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMaximum"] = 22] = "IntegerExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["IntegerExclusiveMinimum"] = 23] = "IntegerExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMaximum"] = 24] = "IntegerMaximum";
  ValueErrorType2[ValueErrorType2["IntegerMinimum"] = 25] = "IntegerMinimum";
  ValueErrorType2[ValueErrorType2["IntegerMultipleOf"] = 26] = "IntegerMultipleOf";
  ValueErrorType2[ValueErrorType2["Integer"] = 27] = "Integer";
  ValueErrorType2[ValueErrorType2["IntersectUnevaluatedProperties"] = 28] = "IntersectUnevaluatedProperties";
  ValueErrorType2[ValueErrorType2["Intersect"] = 29] = "Intersect";
  ValueErrorType2[ValueErrorType2["Iterator"] = 30] = "Iterator";
  ValueErrorType2[ValueErrorType2["Kind"] = 31] = "Kind";
  ValueErrorType2[ValueErrorType2["Literal"] = 32] = "Literal";
  ValueErrorType2[ValueErrorType2["Never"] = 33] = "Never";
  ValueErrorType2[ValueErrorType2["Not"] = 34] = "Not";
  ValueErrorType2[ValueErrorType2["Null"] = 35] = "Null";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMaximum"] = 36] = "NumberExclusiveMaximum";
  ValueErrorType2[ValueErrorType2["NumberExclusiveMinimum"] = 37] = "NumberExclusiveMinimum";
  ValueErrorType2[ValueErrorType2["NumberMaximum"] = 38] = "NumberMaximum";
  ValueErrorType2[ValueErrorType2["NumberMinimum"] = 39] = "NumberMinimum";
  ValueErrorType2[ValueErrorType2["NumberMultipleOf"] = 40] = "NumberMultipleOf";
  ValueErrorType2[ValueErrorType2["Number"] = 41] = "Number";
  ValueErrorType2[ValueErrorType2["ObjectAdditionalProperties"] = 42] = "ObjectAdditionalProperties";
  ValueErrorType2[ValueErrorType2["ObjectMaxProperties"] = 43] = "ObjectMaxProperties";
  ValueErrorType2[ValueErrorType2["ObjectMinProperties"] = 44] = "ObjectMinProperties";
  ValueErrorType2[ValueErrorType2["ObjectRequiredProperty"] = 45] = "ObjectRequiredProperty";
  ValueErrorType2[ValueErrorType2["Object"] = 46] = "Object";
  ValueErrorType2[ValueErrorType2["Promise"] = 47] = "Promise";
  ValueErrorType2[ValueErrorType2["RegExp"] = 48] = "RegExp";
  ValueErrorType2[ValueErrorType2["StringFormatUnknown"] = 49] = "StringFormatUnknown";
  ValueErrorType2[ValueErrorType2["StringFormat"] = 50] = "StringFormat";
  ValueErrorType2[ValueErrorType2["StringMaxLength"] = 51] = "StringMaxLength";
  ValueErrorType2[ValueErrorType2["StringMinLength"] = 52] = "StringMinLength";
  ValueErrorType2[ValueErrorType2["StringPattern"] = 53] = "StringPattern";
  ValueErrorType2[ValueErrorType2["String"] = 54] = "String";
  ValueErrorType2[ValueErrorType2["Symbol"] = 55] = "Symbol";
  ValueErrorType2[ValueErrorType2["TupleLength"] = 56] = "TupleLength";
  ValueErrorType2[ValueErrorType2["Tuple"] = 57] = "Tuple";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMaxByteLength"] = 58] = "Uint8ArrayMaxByteLength";
  ValueErrorType2[ValueErrorType2["Uint8ArrayMinByteLength"] = 59] = "Uint8ArrayMinByteLength";
  ValueErrorType2[ValueErrorType2["Uint8Array"] = 60] = "Uint8Array";
  ValueErrorType2[ValueErrorType2["Undefined"] = 61] = "Undefined";
  ValueErrorType2[ValueErrorType2["Union"] = 62] = "Union";
  ValueErrorType2[ValueErrorType2["Void"] = 63] = "Void";
})(ValueErrorType || (ValueErrorType = {}));
class ValueErrorsUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
function EscapeKey(key) {
  return key.replace(/~/g, "~0").replace(/\//g, "~1");
}
function IsDefined(value) {
  return value !== void 0;
}
class ValueErrorIterator {
  constructor(iterator) {
    this.iterator = iterator;
  }
  [Symbol.iterator]() {
    return this.iterator;
  }
  /** Returns the first value error or undefined if no errors */
  First() {
    const next2 = this.iterator.next();
    return next2.done ? void 0 : next2.value;
  }
}
function Create$1(errorType, schema, path, value, errors = []) {
  return {
    type: errorType,
    schema,
    path,
    value,
    message: GetErrorFunction()({ errorType, path, schema, value, errors }),
    errors
  };
}
function* FromAny$1(schema, references, path, value) {
}
function* FromArray$7(schema, references, path, value) {
  if (!IsArray$2(value)) {
    return yield Create$1(ValueErrorType.Array, schema, path, value);
  }
  if (IsDefined(schema.minItems) && !(value.length >= schema.minItems)) {
    yield Create$1(ValueErrorType.ArrayMinItems, schema, path, value);
  }
  if (IsDefined(schema.maxItems) && !(value.length <= schema.maxItems)) {
    yield Create$1(ValueErrorType.ArrayMaxItems, schema, path, value);
  }
  for (let i = 0; i < value.length; i++) {
    yield* Visit$6(schema.items, references, `${path}/${i}`, value[i]);
  }
  if (schema.uniqueItems === true && !function() {
    const set2 = /* @__PURE__ */ new Set();
    for (const element of value) {
      const hashed = Hash(element);
      if (set2.has(hashed)) {
        return false;
      } else {
        set2.add(hashed);
      }
    }
    return true;
  }()) {
    yield Create$1(ValueErrorType.ArrayUniqueItems, schema, path, value);
  }
  if (!(IsDefined(schema.contains) || IsDefined(schema.minContains) || IsDefined(schema.maxContains))) {
    return;
  }
  const containsSchema = IsDefined(schema.contains) ? schema.contains : Never();
  const containsCount = value.reduce((acc, value2, index) => Visit$6(containsSchema, references, `${path}${index}`, value2).next().done === true ? acc + 1 : acc, 0);
  if (containsCount === 0) {
    yield Create$1(ValueErrorType.ArrayContains, schema, path, value);
  }
  if (IsNumber$2(schema.minContains) && containsCount < schema.minContains) {
    yield Create$1(ValueErrorType.ArrayMinContains, schema, path, value);
  }
  if (IsNumber$2(schema.maxContains) && containsCount > schema.maxContains) {
    yield Create$1(ValueErrorType.ArrayMaxContains, schema, path, value);
  }
}
function* FromAsyncIterator$2(schema, references, path, value) {
  if (!IsAsyncIterator$2(value))
    yield Create$1(ValueErrorType.AsyncIterator, schema, path, value);
}
function* FromBigInt$1(schema, references, path, value) {
  if (!IsBigInt$2(value))
    return yield Create$1(ValueErrorType.BigInt, schema, path, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.BigIntExclusiveMaximum, schema, path, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.BigIntExclusiveMinimum, schema, path, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.BigIntMaximum, schema, path, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.BigIntMinimum, schema, path, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === BigInt(0))) {
    yield Create$1(ValueErrorType.BigIntMultipleOf, schema, path, value);
  }
}
function* FromBoolean$1(schema, references, path, value) {
  if (!IsBoolean$2(value))
    yield Create$1(ValueErrorType.Boolean, schema, path, value);
}
function* FromConstructor$2(schema, references, path, value) {
  yield* Visit$6(schema.returns, references, path, value.prototype);
}
function* FromDate$3(schema, references, path, value) {
  if (!IsDate$2(value))
    return yield Create$1(ValueErrorType.Date, schema, path, value);
  if (IsDefined(schema.exclusiveMaximumTimestamp) && !(value.getTime() < schema.exclusiveMaximumTimestamp)) {
    yield Create$1(ValueErrorType.DateExclusiveMaximumTimestamp, schema, path, value);
  }
  if (IsDefined(schema.exclusiveMinimumTimestamp) && !(value.getTime() > schema.exclusiveMinimumTimestamp)) {
    yield Create$1(ValueErrorType.DateExclusiveMinimumTimestamp, schema, path, value);
  }
  if (IsDefined(schema.maximumTimestamp) && !(value.getTime() <= schema.maximumTimestamp)) {
    yield Create$1(ValueErrorType.DateMaximumTimestamp, schema, path, value);
  }
  if (IsDefined(schema.minimumTimestamp) && !(value.getTime() >= schema.minimumTimestamp)) {
    yield Create$1(ValueErrorType.DateMinimumTimestamp, schema, path, value);
  }
  if (IsDefined(schema.multipleOfTimestamp) && !(value.getTime() % schema.multipleOfTimestamp === 0)) {
    yield Create$1(ValueErrorType.DateMultipleOfTimestamp, schema, path, value);
  }
}
function* FromFunction$2(schema, references, path, value) {
  if (!IsFunction$2(value))
    yield Create$1(ValueErrorType.Function, schema, path, value);
}
function* FromImport$5(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  yield* Visit$6(target, [...references, ...definitions], path, value);
}
function* FromInteger$1(schema, references, path, value) {
  if (!IsInteger$2(value))
    return yield Create$1(ValueErrorType.Integer, schema, path, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.IntegerExclusiveMaximum, schema, path, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.IntegerExclusiveMinimum, schema, path, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.IntegerMaximum, schema, path, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.IntegerMinimum, schema, path, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create$1(ValueErrorType.IntegerMultipleOf, schema, path, value);
  }
}
function* FromIntersect$6(schema, references, path, value) {
  let hasError = false;
  for (const inner of schema.allOf) {
    for (const error2 of Visit$6(inner, references, path, value)) {
      hasError = true;
      yield error2;
    }
  }
  if (hasError) {
    return yield Create$1(ValueErrorType.Intersect, schema, path, value);
  }
  if (schema.unevaluatedProperties === false) {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        yield Create$1(ValueErrorType.IntersectUnevaluatedProperties, schema, `${path}/${valueKey}`, value);
      }
    }
  }
  if (typeof schema.unevaluatedProperties === "object") {
    const keyCheck = new RegExp(KeyOfPattern(schema));
    for (const valueKey of Object.getOwnPropertyNames(value)) {
      if (!keyCheck.test(valueKey)) {
        const next2 = Visit$6(schema.unevaluatedProperties, references, `${path}/${valueKey}`, value[valueKey]).next();
        if (!next2.done)
          yield next2.value;
      }
    }
  }
}
function* FromIterator$2(schema, references, path, value) {
  if (!IsIterator$2(value))
    yield Create$1(ValueErrorType.Iterator, schema, path, value);
}
function* FromLiteral$1(schema, references, path, value) {
  if (!(value === schema.const))
    yield Create$1(ValueErrorType.Literal, schema, path, value);
}
function* FromNever$1(schema, references, path, value) {
  yield Create$1(ValueErrorType.Never, schema, path, value);
}
function* FromNot$4(schema, references, path, value) {
  if (Visit$6(schema.not, references, path, value).next().done === true)
    yield Create$1(ValueErrorType.Not, schema, path, value);
}
function* FromNull$1(schema, references, path, value) {
  if (!IsNull$2(value))
    yield Create$1(ValueErrorType.Null, schema, path, value);
}
function* FromNumber$1(schema, references, path, value) {
  if (!TypeSystemPolicy.IsNumberLike(value))
    return yield Create$1(ValueErrorType.Number, schema, path, value);
  if (IsDefined(schema.exclusiveMaximum) && !(value < schema.exclusiveMaximum)) {
    yield Create$1(ValueErrorType.NumberExclusiveMaximum, schema, path, value);
  }
  if (IsDefined(schema.exclusiveMinimum) && !(value > schema.exclusiveMinimum)) {
    yield Create$1(ValueErrorType.NumberExclusiveMinimum, schema, path, value);
  }
  if (IsDefined(schema.maximum) && !(value <= schema.maximum)) {
    yield Create$1(ValueErrorType.NumberMaximum, schema, path, value);
  }
  if (IsDefined(schema.minimum) && !(value >= schema.minimum)) {
    yield Create$1(ValueErrorType.NumberMinimum, schema, path, value);
  }
  if (IsDefined(schema.multipleOf) && !(value % schema.multipleOf === 0)) {
    yield Create$1(ValueErrorType.NumberMultipleOf, schema, path, value);
  }
}
function* FromObject$7(schema, references, path, value) {
  if (!TypeSystemPolicy.IsObjectLike(value))
    return yield Create$1(ValueErrorType.Object, schema, path, value);
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create$1(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create$1(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const requiredKeys = Array.isArray(schema.required) ? schema.required : [];
  const knownKeys = Object.getOwnPropertyNames(schema.properties);
  const unknownKeys = Object.getOwnPropertyNames(value);
  for (const requiredKey of requiredKeys) {
    if (unknownKeys.includes(requiredKey))
      continue;
    yield Create$1(ValueErrorType.ObjectRequiredProperty, schema.properties[requiredKey], `${path}/${EscapeKey(requiredKey)}`, void 0);
  }
  if (schema.additionalProperties === false) {
    for (const valueKey of unknownKeys) {
      if (!knownKeys.includes(valueKey)) {
        yield Create$1(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
      }
    }
  }
  if (typeof schema.additionalProperties === "object") {
    for (const valueKey of unknownKeys) {
      if (knownKeys.includes(valueKey))
        continue;
      yield* Visit$6(schema.additionalProperties, references, `${path}/${EscapeKey(valueKey)}`, value[valueKey]);
    }
  }
  for (const knownKey of knownKeys) {
    const property = schema.properties[knownKey];
    if (schema.required && schema.required.includes(knownKey)) {
      yield* Visit$6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      if (ExtendsUndefinedCheck(schema) && !(knownKey in value)) {
        yield Create$1(ValueErrorType.ObjectRequiredProperty, property, `${path}/${EscapeKey(knownKey)}`, void 0);
      }
    } else {
      if (TypeSystemPolicy.IsExactOptionalProperty(value, knownKey)) {
        yield* Visit$6(property, references, `${path}/${EscapeKey(knownKey)}`, value[knownKey]);
      }
    }
  }
}
function* FromPromise$2(schema, references, path, value) {
  if (!IsPromise$2(value))
    yield Create$1(ValueErrorType.Promise, schema, path, value);
}
function* FromRecord$6(schema, references, path, value) {
  if (!TypeSystemPolicy.IsRecordLike(value))
    return yield Create$1(ValueErrorType.Object, schema, path, value);
  if (IsDefined(schema.minProperties) && !(Object.getOwnPropertyNames(value).length >= schema.minProperties)) {
    yield Create$1(ValueErrorType.ObjectMinProperties, schema, path, value);
  }
  if (IsDefined(schema.maxProperties) && !(Object.getOwnPropertyNames(value).length <= schema.maxProperties)) {
    yield Create$1(ValueErrorType.ObjectMaxProperties, schema, path, value);
  }
  const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
  const regex2 = new RegExp(patternKey);
  for (const [propertyKey, propertyValue] of Object.entries(value)) {
    if (regex2.test(propertyKey))
      yield* Visit$6(patternSchema, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
  }
  if (typeof schema.additionalProperties === "object") {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (!regex2.test(propertyKey))
        yield* Visit$6(schema.additionalProperties, references, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
  if (schema.additionalProperties === false) {
    for (const [propertyKey, propertyValue] of Object.entries(value)) {
      if (regex2.test(propertyKey))
        continue;
      return yield Create$1(ValueErrorType.ObjectAdditionalProperties, schema, `${path}/${EscapeKey(propertyKey)}`, propertyValue);
    }
  }
}
function* FromRef$6(schema, references, path, value) {
  yield* Visit$6(Deref(schema, references), references, path, value);
}
function* FromRegExp$1(schema, references, path, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path, value);
  if (IsDefined(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create$1(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create$1(ValueErrorType.StringMaxLength, schema, path, value);
  }
  const regex2 = new RegExp(schema.source, schema.flags);
  if (!regex2.test(value)) {
    return yield Create$1(ValueErrorType.RegExp, schema, path, value);
  }
}
function* FromString$1(schema, references, path, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path, value);
  if (IsDefined(schema.minLength) && !(value.length >= schema.minLength)) {
    yield Create$1(ValueErrorType.StringMinLength, schema, path, value);
  }
  if (IsDefined(schema.maxLength) && !(value.length <= schema.maxLength)) {
    yield Create$1(ValueErrorType.StringMaxLength, schema, path, value);
  }
  if (IsString$2(schema.pattern)) {
    const regex2 = new RegExp(schema.pattern);
    if (!regex2.test(value)) {
      yield Create$1(ValueErrorType.StringPattern, schema, path, value);
    }
  }
  if (IsString$2(schema.format)) {
    if (!Has$1(schema.format)) {
      yield Create$1(ValueErrorType.StringFormatUnknown, schema, path, value);
    } else {
      const format = Get$1(schema.format);
      if (!format(value)) {
        yield Create$1(ValueErrorType.StringFormat, schema, path, value);
      }
    }
  }
}
function* FromSymbol$1(schema, references, path, value) {
  if (!IsSymbol$2(value))
    yield Create$1(ValueErrorType.Symbol, schema, path, value);
}
function* FromTemplateLiteral$1(schema, references, path, value) {
  if (!IsString$2(value))
    return yield Create$1(ValueErrorType.String, schema, path, value);
  const regex2 = new RegExp(schema.pattern);
  if (!regex2.test(value)) {
    yield Create$1(ValueErrorType.StringPattern, schema, path, value);
  }
}
function* FromThis$6(schema, references, path, value) {
  yield* Visit$6(Deref(schema, references), references, path, value);
}
function* FromTuple$6(schema, references, path, value) {
  if (!IsArray$2(value))
    return yield Create$1(ValueErrorType.Tuple, schema, path, value);
  if (schema.items === void 0 && !(value.length === 0)) {
    return yield Create$1(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!(value.length === schema.maxItems)) {
    return yield Create$1(ValueErrorType.TupleLength, schema, path, value);
  }
  if (!schema.items) {
    return;
  }
  for (let i = 0; i < schema.items.length; i++) {
    yield* Visit$6(schema.items[i], references, `${path}/${i}`, value[i]);
  }
}
function* FromUndefined$1(schema, references, path, value) {
  if (!IsUndefined$2(value))
    yield Create$1(ValueErrorType.Undefined, schema, path, value);
}
function* FromUnion$6(schema, references, path, value) {
  if (Check(schema, references, value))
    return;
  const errors = schema.anyOf.map((variant) => new ValueErrorIterator(Visit$6(variant, references, path, value)));
  yield Create$1(ValueErrorType.Union, schema, path, value, errors);
}
function* FromUint8Array$1(schema, references, path, value) {
  if (!IsUint8Array$2(value))
    return yield Create$1(ValueErrorType.Uint8Array, schema, path, value);
  if (IsDefined(schema.maxByteLength) && !(value.length <= schema.maxByteLength)) {
    yield Create$1(ValueErrorType.Uint8ArrayMaxByteLength, schema, path, value);
  }
  if (IsDefined(schema.minByteLength) && !(value.length >= schema.minByteLength)) {
    yield Create$1(ValueErrorType.Uint8ArrayMinByteLength, schema, path, value);
  }
}
function* FromUnknown$1(schema, references, path, value) {
}
function* FromVoid$1(schema, references, path, value) {
  if (!TypeSystemPolicy.IsVoidLike(value))
    yield Create$1(ValueErrorType.Void, schema, path, value);
}
function* FromKind$1(schema, references, path, value) {
  const check = Get(schema[Kind$1]);
  if (!check(schema, value))
    yield Create$1(ValueErrorType.Kind, schema, path, value);
}
function* Visit$6(schema, references, path, value) {
  const references_ = IsDefined(schema.$id) ? [...references, schema] : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return yield* FromAny$1();
    case "Array":
      return yield* FromArray$7(schema_, references_, path, value);
    case "AsyncIterator":
      return yield* FromAsyncIterator$2(schema_, references_, path, value);
    case "BigInt":
      return yield* FromBigInt$1(schema_, references_, path, value);
    case "Boolean":
      return yield* FromBoolean$1(schema_, references_, path, value);
    case "Constructor":
      return yield* FromConstructor$2(schema_, references_, path, value);
    case "Date":
      return yield* FromDate$3(schema_, references_, path, value);
    case "Function":
      return yield* FromFunction$2(schema_, references_, path, value);
    case "Import":
      return yield* FromImport$5(schema_, references_, path, value);
    case "Integer":
      return yield* FromInteger$1(schema_, references_, path, value);
    case "Intersect":
      return yield* FromIntersect$6(schema_, references_, path, value);
    case "Iterator":
      return yield* FromIterator$2(schema_, references_, path, value);
    case "Literal":
      return yield* FromLiteral$1(schema_, references_, path, value);
    case "Never":
      return yield* FromNever$1(schema_, references_, path, value);
    case "Not":
      return yield* FromNot$4(schema_, references_, path, value);
    case "Null":
      return yield* FromNull$1(schema_, references_, path, value);
    case "Number":
      return yield* FromNumber$1(schema_, references_, path, value);
    case "Object":
      return yield* FromObject$7(schema_, references_, path, value);
    case "Promise":
      return yield* FromPromise$2(schema_, references_, path, value);
    case "Record":
      return yield* FromRecord$6(schema_, references_, path, value);
    case "Ref":
      return yield* FromRef$6(schema_, references_, path, value);
    case "RegExp":
      return yield* FromRegExp$1(schema_, references_, path, value);
    case "String":
      return yield* FromString$1(schema_, references_, path, value);
    case "Symbol":
      return yield* FromSymbol$1(schema_, references_, path, value);
    case "TemplateLiteral":
      return yield* FromTemplateLiteral$1(schema_, references_, path, value);
    case "This":
      return yield* FromThis$6(schema_, references_, path, value);
    case "Tuple":
      return yield* FromTuple$6(schema_, references_, path, value);
    case "Undefined":
      return yield* FromUndefined$1(schema_, references_, path, value);
    case "Union":
      return yield* FromUnion$6(schema_, references_, path, value);
    case "Uint8Array":
      return yield* FromUint8Array$1(schema_, references_, path, value);
    case "Unknown":
      return yield* FromUnknown$1();
    case "Void":
      return yield* FromVoid$1(schema_, references_, path, value);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueErrorsUnknownTypeError(schema);
      return yield* FromKind$1(schema_, references_, path, value);
  }
}
function Errors(...args) {
  const iterator = args.length === 3 ? Visit$6(args[0], args[1], "", args[2]) : Visit$6(args[0], [], "", args[1]);
  return new ValueErrorIterator(iterator);
}
class TransformDecodeCheckError extends TypeBoxError {
  constructor(schema, value, error2) {
    super(`Unable to decode value as it does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error2;
  }
}
class TransformDecodeError extends TypeBoxError {
  constructor(schema, path, value, error2) {
    super(error2 instanceof Error ? error2.message : "Unknown error");
    this.schema = schema;
    this.path = path;
    this.value = value;
    this.error = error2;
  }
}
function Default$2(schema, path, value) {
  try {
    return IsTransform$1(schema) ? schema[TransformKind].Decode(value) : value;
  } catch (error2) {
    throw new TransformDecodeError(schema, path, value, error2);
  }
}
function FromArray$6(schema, references, path, value) {
  return IsArray$2(value) ? Default$2(schema, path, value.map((value2, index) => Visit$5(schema.items, references, `${path}/${index}`, value2))) : Default$2(schema, path, value);
}
function FromIntersect$5(schema, references, path, value) {
  if (!IsObject$2(value) || IsValueType(value))
    return Default$2(schema, path, value);
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...value };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit$5(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform$1(schema.unevaluatedProperties)) {
    return Default$2(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default$2(unevaluatedProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path, unknownProperties);
}
function FromImport$4(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const transform = schema[TransformKind];
  const transformTarget = { [TransformKind]: transform, ...target };
  return Visit$5(transformTarget, [...references, ...definitions], path, value);
}
function FromNot$3(schema, references, path, value) {
  return Default$2(schema, path, Visit$5(schema.not, references, path, value));
}
function FromObject$6(schema, references, path, value) {
  if (!IsObject$2(value))
    return Default$2(schema, path, value);
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...value };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined$2(knownProperties[key]) && (!IsUndefined$1(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit$5(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema$1(schema.additionalProperties)) {
    return Default$2(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      unknownProperties[key] = Default$2(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path, unknownProperties);
}
function FromRecord$5(schema, references, path, value) {
  if (!IsObject$2(value))
    return Default$2(schema, path, value);
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...value };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit$5(schema.patternProperties[pattern], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema$1(schema.additionalProperties)) {
    return Default$2(schema, path, knownProperties);
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const unknownProperties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      unknownProperties[key] = Default$2(additionalProperties, `${path}/${key}`, unknownProperties[key]);
    }
  return Default$2(schema, path, unknownProperties);
}
function FromRef$5(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default$2(schema, path, Visit$5(target, references, path, value));
}
function FromThis$5(schema, references, path, value) {
  const target = Deref(schema, references);
  return Default$2(schema, path, Visit$5(target, references, path, value));
}
function FromTuple$5(schema, references, path, value) {
  return IsArray$2(value) && IsArray$2(schema.items) ? Default$2(schema, path, schema.items.map((schema2, index) => Visit$5(schema2, references, `${path}/${index}`, value[index]))) : Default$2(schema, path, value);
}
function FromUnion$5(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const decoded = Visit$5(subschema, references, path, value);
    return Default$2(schema, path, decoded);
  }
  return Default$2(schema, path, value);
}
function Visit$5(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$6(schema_, references_, path, value);
    case "Import":
      return FromImport$4(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect$5(schema_, references_, path, value);
    case "Not":
      return FromNot$3(schema_, references_, path, value);
    case "Object":
      return FromObject$6(schema_, references_, path, value);
    case "Record":
      return FromRecord$5(schema_, references_, path, value);
    case "Ref":
      return FromRef$5(schema_, references_, path, value);
    case "Symbol":
      return Default$2(schema_, path, value);
    case "This":
      return FromThis$5(schema_, references_, path, value);
    case "Tuple":
      return FromTuple$5(schema_, references_, path, value);
    case "Union":
      return FromUnion$5(schema_, references_, path, value);
    default:
      return Default$2(schema_, path, value);
  }
}
function TransformDecode(schema, references, value) {
  return Visit$5(schema, references, "", value);
}
class TransformEncodeCheckError extends TypeBoxError {
  constructor(schema, value, error2) {
    super(`The encoded value does not match the expected schema`);
    this.schema = schema;
    this.value = value;
    this.error = error2;
  }
}
class TransformEncodeError extends TypeBoxError {
  constructor(schema, path, value, error2) {
    super(`${error2 instanceof Error ? error2.message : "Unknown error"}`);
    this.schema = schema;
    this.path = path;
    this.value = value;
    this.error = error2;
  }
}
function Default$1(schema, path, value) {
  try {
    return IsTransform$1(schema) ? schema[TransformKind].Encode(value) : value;
  } catch (error2) {
    throw new TransformEncodeError(schema, path, value, error2);
  }
}
function FromArray$5(schema, references, path, value) {
  const defaulted = Default$1(schema, path, value);
  return IsArray$2(defaulted) ? defaulted.map((value2, index) => Visit$4(schema.items, references, `${path}/${index}`, value2)) : defaulted;
}
function FromImport$3(schema, references, path, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  const transform = schema[TransformKind];
  const transformTarget = { [TransformKind]: transform, ...target };
  return Visit$4(transformTarget, [...references, ...definitions], path, value);
}
function FromIntersect$4(schema, references, path, value) {
  const defaulted = Default$1(schema, path, value);
  if (!IsObject$2(value) || IsValueType(value))
    return defaulted;
  const knownEntries = KeyOfPropertyEntries(schema);
  const knownKeys = knownEntries.map((entry) => entry[0]);
  const knownProperties = { ...defaulted };
  for (const [knownKey, knownSchema] of knownEntries)
    if (knownKey in knownProperties) {
      knownProperties[knownKey] = Visit$4(knownSchema, references, `${path}/${knownKey}`, knownProperties[knownKey]);
    }
  if (!IsTransform$1(schema.unevaluatedProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const unevaluatedProperties = schema.unevaluatedProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default$1(unevaluatedProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromNot$2(schema, references, path, value) {
  return Default$1(schema.not, path, Default$1(schema, path, value));
}
function FromObject$5(schema, references, path, value) {
  const defaulted = Default$1(schema, path, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const knownKeys = KeyOfPropertyKeys(schema);
  const knownProperties = { ...defaulted };
  for (const key of knownKeys) {
    if (!HasPropertyKey(knownProperties, key))
      continue;
    if (IsUndefined$2(knownProperties[key]) && (!IsUndefined$1(schema.properties[key]) || TypeSystemPolicy.IsExactOptionalProperty(knownProperties, key)))
      continue;
    knownProperties[key] = Visit$4(schema.properties[key], references, `${path}/${key}`, knownProperties[key]);
  }
  if (!IsSchema$1(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.includes(key)) {
      properties[key] = Default$1(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRecord$4(schema, references, path, value) {
  const defaulted = Default$1(schema, path, value);
  if (!IsObject$2(value))
    return defaulted;
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const knownKeys = new RegExp(pattern);
  const knownProperties = { ...defaulted };
  for (const key of Object.getOwnPropertyNames(value))
    if (knownKeys.test(key)) {
      knownProperties[key] = Visit$4(schema.patternProperties[pattern], references, `${path}/${key}`, knownProperties[key]);
    }
  if (!IsSchema$1(schema.additionalProperties)) {
    return knownProperties;
  }
  const unknownKeys = Object.getOwnPropertyNames(knownProperties);
  const additionalProperties = schema.additionalProperties;
  const properties = { ...knownProperties };
  for (const key of unknownKeys)
    if (!knownKeys.test(key)) {
      properties[key] = Default$1(additionalProperties, `${path}/${key}`, properties[key]);
    }
  return properties;
}
function FromRef$4(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit$4(target, references, path, value);
  return Default$1(schema, path, resolved);
}
function FromThis$4(schema, references, path, value) {
  const target = Deref(schema, references);
  const resolved = Visit$4(target, references, path, value);
  return Default$1(schema, path, resolved);
}
function FromTuple$4(schema, references, path, value) {
  const value1 = Default$1(schema, path, value);
  return IsArray$2(schema.items) ? schema.items.map((schema2, index) => Visit$4(schema2, references, `${path}/${index}`, value1[index])) : [];
}
function FromUnion$4(schema, references, path, value) {
  for (const subschema of schema.anyOf) {
    if (!Check(subschema, references, value))
      continue;
    const value1 = Visit$4(subschema, references, path, value);
    return Default$1(schema, path, value1);
  }
  for (const subschema of schema.anyOf) {
    const value1 = Visit$4(subschema, references, path, value);
    if (!Check(schema, references, value1))
      continue;
    return Default$1(schema, path, value1);
  }
  return Default$1(schema, path, value);
}
function Visit$4(schema, references, path, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$5(schema_, references_, path, value);
    case "Import":
      return FromImport$3(schema_, references_, path, value);
    case "Intersect":
      return FromIntersect$4(schema_, references_, path, value);
    case "Not":
      return FromNot$2(schema_, references_, path, value);
    case "Object":
      return FromObject$5(schema_, references_, path, value);
    case "Record":
      return FromRecord$4(schema_, references_, path, value);
    case "Ref":
      return FromRef$4(schema_, references_, path, value);
    case "This":
      return FromThis$4(schema_, references_, path, value);
    case "Tuple":
      return FromTuple$4(schema_, references_, path, value);
    case "Union":
      return FromUnion$4(schema_, references_, path, value);
    default:
      return Default$1(schema_, path, value);
  }
}
function TransformEncode(schema, references, value) {
  return Visit$4(schema, references, "", value);
}
function FromArray$4(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.items, references);
}
function FromAsyncIterator$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.items, references);
}
function FromConstructor$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.returns, references) || schema.parameters.some((schema2) => Visit$3(schema2, references));
}
function FromFunction$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.returns, references) || schema.parameters.some((schema2) => Visit$3(schema2, references));
}
function FromIntersect$3(schema, references) {
  return IsTransform$1(schema) || IsTransform$1(schema.unevaluatedProperties) || schema.allOf.some((schema2) => Visit$3(schema2, references));
}
function FromIterator$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.items, references);
}
function FromNot$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.not, references);
}
function FromObject$4(schema, references) {
  return IsTransform$1(schema) || Object.values(schema.properties).some((schema2) => Visit$3(schema2, references)) || IsSchema$1(schema.additionalProperties) && Visit$3(schema.additionalProperties, references);
}
function FromPromise$1(schema, references) {
  return IsTransform$1(schema) || Visit$3(schema.item, references);
}
function FromRecord$3(schema, references) {
  const pattern = Object.getOwnPropertyNames(schema.patternProperties)[0];
  const property = schema.patternProperties[pattern];
  return IsTransform$1(schema) || Visit$3(property, references) || IsSchema$1(schema.additionalProperties) && IsTransform$1(schema.additionalProperties);
}
function FromRef$3(schema, references) {
  if (IsTransform$1(schema))
    return true;
  return Visit$3(Deref(schema, references), references);
}
function FromThis$3(schema, references) {
  if (IsTransform$1(schema))
    return true;
  return Visit$3(Deref(schema, references), references);
}
function FromTuple$3(schema, references) {
  return IsTransform$1(schema) || !IsUndefined$2(schema.items) && schema.items.some((schema2) => Visit$3(schema2, references));
}
function FromUnion$3(schema, references) {
  return IsTransform$1(schema) || schema.anyOf.some((schema2) => Visit$3(schema2, references));
}
function Visit$3(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  if (schema.$id && visited.has(schema.$id))
    return false;
  if (schema.$id)
    visited.add(schema.$id);
  switch (schema[Kind$1]) {
    case "Array":
      return FromArray$4(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator$1(schema_, references_);
    case "Constructor":
      return FromConstructor$1(schema_, references_);
    case "Function":
      return FromFunction$1(schema_, references_);
    case "Intersect":
      return FromIntersect$3(schema_, references_);
    case "Iterator":
      return FromIterator$1(schema_, references_);
    case "Not":
      return FromNot$1(schema_, references_);
    case "Object":
      return FromObject$4(schema_, references_);
    case "Promise":
      return FromPromise$1(schema_, references_);
    case "Record":
      return FromRecord$3(schema_, references_);
    case "Ref":
      return FromRef$3(schema_, references_);
    case "This":
      return FromThis$3(schema_, references_);
    case "Tuple":
      return FromTuple$3(schema_, references_);
    case "Union":
      return FromUnion$3(schema_, references_);
    default:
      return IsTransform$1(schema);
  }
}
const visited = /* @__PURE__ */ new Set();
function HasTransform(schema, references) {
  visited.clear();
  return Visit$3(schema, references);
}
class TypeCheck {
  constructor(schema, references, checkFunc, code) {
    this.schema = schema;
    this.references = references;
    this.checkFunc = checkFunc;
    this.code = code;
    this.hasTransform = HasTransform(schema, references);
  }
  /** Returns the generated assertion code used to validate this type. */
  Code() {
    return this.code;
  }
  /** Returns the schema type used to validate */
  Schema() {
    return this.schema;
  }
  /** Returns reference types used to validate */
  References() {
    return this.references;
  }
  /** Returns an iterator for each error in this value. */
  Errors(value) {
    return Errors(this.schema, this.references, value);
  }
  /** Returns true if the value matches the compiled type. */
  Check(value) {
    return this.checkFunc(value);
  }
  /** Decodes a value or throws if error */
  Decode(value) {
    if (!this.checkFunc(value))
      throw new TransformDecodeCheckError(this.schema, value, this.Errors(value).First());
    return this.hasTransform ? TransformDecode(this.schema, this.references, value) : value;
  }
  /** Encodes a value or throws if error */
  Encode(value) {
    const encoded = this.hasTransform ? TransformEncode(this.schema, this.references, value) : value;
    if (!this.checkFunc(encoded))
      throw new TransformEncodeCheckError(this.schema, value, this.Errors(value).First());
    return encoded;
  }
}
var Character;
(function(Character2) {
  function DollarSign(code) {
    return code === 36;
  }
  Character2.DollarSign = DollarSign;
  function IsUnderscore(code) {
    return code === 95;
  }
  Character2.IsUnderscore = IsUnderscore;
  function IsAlpha(code) {
    return code >= 65 && code <= 90 || code >= 97 && code <= 122;
  }
  Character2.IsAlpha = IsAlpha;
  function IsNumeric(code) {
    return code >= 48 && code <= 57;
  }
  Character2.IsNumeric = IsNumeric;
})(Character || (Character = {}));
var MemberExpression;
(function(MemberExpression2) {
  function IsFirstCharacterNumeric(value) {
    if (value.length === 0)
      return false;
    return Character.IsNumeric(value.charCodeAt(0));
  }
  function IsAccessor(value) {
    if (IsFirstCharacterNumeric(value))
      return false;
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const check = Character.IsAlpha(code) || Character.IsNumeric(code) || Character.DollarSign(code) || Character.IsUnderscore(code);
      if (!check)
        return false;
    }
    return true;
  }
  function EscapeHyphen(key) {
    return key.replace(/'/g, "\\'");
  }
  function Encode2(object, key) {
    return IsAccessor(key) ? `${object}.${key}` : `${object}['${EscapeHyphen(key)}']`;
  }
  MemberExpression2.Encode = Encode2;
})(MemberExpression || (MemberExpression = {}));
var Identifier;
(function(Identifier2) {
  function Encode2($id) {
    const buffer = [];
    for (let i = 0; i < $id.length; i++) {
      const code = $id.charCodeAt(i);
      if (Character.IsNumeric(code) || Character.IsAlpha(code)) {
        buffer.push($id.charAt(i));
      } else {
        buffer.push(`_${code}_`);
      }
    }
    return buffer.join("").replace(/__/g, "_");
  }
  Identifier2.Encode = Encode2;
})(Identifier || (Identifier = {}));
var LiteralString;
(function(LiteralString2) {
  function Escape2(content) {
    return content.replace(/'/g, "\\'");
  }
  LiteralString2.Escape = Escape2;
})(LiteralString || (LiteralString = {}));
class TypeCompilerUnknownTypeError extends TypeBoxError {
  constructor(schema) {
    super("Unknown type");
    this.schema = schema;
  }
}
class TypeCompilerTypeGuardError extends TypeBoxError {
  constructor(schema) {
    super("Preflight validation check failed to guard for the given schema");
    this.schema = schema;
  }
}
var Policy;
(function(Policy2) {
  function IsExactOptionalProperty(value, key, expression) {
    return TypeSystemPolicy.ExactOptionalPropertyTypes ? `('${key}' in ${value} ? ${expression} : true)` : `(${MemberExpression.Encode(value, key)} !== undefined ? ${expression} : true)`;
  }
  Policy2.IsExactOptionalProperty = IsExactOptionalProperty;
  function IsObjectLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}))` : `(typeof ${value} === 'object' && ${value} !== null)`;
  }
  Policy2.IsObjectLike = IsObjectLike;
  function IsRecordLike(value) {
    return !TypeSystemPolicy.AllowArrayObject ? `(typeof ${value} === 'object' && ${value} !== null && !Array.isArray(${value}) && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))` : `(typeof ${value} === 'object' && ${value} !== null && !(${value} instanceof Date) && !(${value} instanceof Uint8Array))`;
  }
  Policy2.IsRecordLike = IsRecordLike;
  function IsNumberLike(value) {
    return TypeSystemPolicy.AllowNaN ? `typeof ${value} === 'number'` : `Number.isFinite(${value})`;
  }
  Policy2.IsNumberLike = IsNumberLike;
  function IsVoidLike(value) {
    return TypeSystemPolicy.AllowNullVoid ? `(${value} === undefined || ${value} === null)` : `${value} === undefined`;
  }
  Policy2.IsVoidLike = IsVoidLike;
})(Policy || (Policy = {}));
var TypeCompiler;
(function(TypeCompiler2) {
  function IsAnyOrUnknown2(schema) {
    return schema[Kind$1] === "Any" || schema[Kind$1] === "Unknown";
  }
  function* FromAny2(schema, references, value) {
    yield "true";
  }
  function* FromArray2(schema, references, value) {
    yield `Array.isArray(${value})`;
    const [parameter, accumulator] = [CreateParameter("value", "any"), CreateParameter("acc", "number")];
    if (IsNumber$2(schema.maxItems))
      yield `${value}.length <= ${schema.maxItems}`;
    if (IsNumber$2(schema.minItems))
      yield `${value}.length >= ${schema.minItems}`;
    const elementExpression = CreateExpression(schema.items, references, "value");
    yield `${value}.every((${parameter}) => ${elementExpression})`;
    if (IsSchema(schema.contains) || IsNumber$2(schema.minContains) || IsNumber$2(schema.maxContains)) {
      const containsSchema = IsSchema(schema.contains) ? schema.contains : Never();
      const checkExpression = CreateExpression(containsSchema, references, "value");
      const checkMinContains = IsNumber$2(schema.minContains) ? [`(count >= ${schema.minContains})`] : [];
      const checkMaxContains = IsNumber$2(schema.maxContains) ? [`(count <= ${schema.maxContains})`] : [];
      const checkCount = `const count = value.reduce((${accumulator}, ${parameter}) => ${checkExpression} ? acc + 1 : acc, 0)`;
      const check = [`(count > 0)`, ...checkMinContains, ...checkMaxContains].join(" && ");
      yield `((${parameter}) => { ${checkCount}; return ${check}})(${value})`;
    }
    if (schema.uniqueItems === true) {
      const check = `const hashed = hash(element); if(set.has(hashed)) { return false } else { set.add(hashed) } } return true`;
      const block = `const set = new Set(); for(const element of value) { ${check} }`;
      yield `((${parameter}) => { ${block} )(${value})`;
    }
  }
  function* FromAsyncIterator2(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.asyncIterator in ${value})`;
  }
  function* FromBigInt2(schema, references, value) {
    yield `(typeof ${value} === 'bigint')`;
    if (IsBigInt$2(schema.exclusiveMaximum))
      yield `${value} < BigInt(${schema.exclusiveMaximum})`;
    if (IsBigInt$2(schema.exclusiveMinimum))
      yield `${value} > BigInt(${schema.exclusiveMinimum})`;
    if (IsBigInt$2(schema.maximum))
      yield `${value} <= BigInt(${schema.maximum})`;
    if (IsBigInt$2(schema.minimum))
      yield `${value} >= BigInt(${schema.minimum})`;
    if (IsBigInt$2(schema.multipleOf))
      yield `(${value} % BigInt(${schema.multipleOf})) === 0`;
  }
  function* FromBoolean2(schema, references, value) {
    yield `(typeof ${value} === 'boolean')`;
  }
  function* FromConstructor2(schema, references, value) {
    yield* Visit2(schema.returns, references, `${value}.prototype`);
  }
  function* FromDate2(schema, references, value) {
    yield `(${value} instanceof Date) && Number.isFinite(${value}.getTime())`;
    if (IsNumber$2(schema.exclusiveMaximumTimestamp))
      yield `${value}.getTime() < ${schema.exclusiveMaximumTimestamp}`;
    if (IsNumber$2(schema.exclusiveMinimumTimestamp))
      yield `${value}.getTime() > ${schema.exclusiveMinimumTimestamp}`;
    if (IsNumber$2(schema.maximumTimestamp))
      yield `${value}.getTime() <= ${schema.maximumTimestamp}`;
    if (IsNumber$2(schema.minimumTimestamp))
      yield `${value}.getTime() >= ${schema.minimumTimestamp}`;
    if (IsNumber$2(schema.multipleOfTimestamp))
      yield `(${value}.getTime() % ${schema.multipleOfTimestamp}) === 0`;
  }
  function* FromFunction2(schema, references, value) {
    yield `(typeof ${value} === 'function')`;
  }
  function* FromImport2(schema, references, value) {
    const members = globalThis.Object.getOwnPropertyNames(schema.$defs).reduce((result, key) => {
      return [...result, schema.$defs[key]];
    }, []);
    yield* Visit2(Ref(schema.$ref), [...references, ...members], value);
  }
  function* FromInteger2(schema, references, value) {
    yield `Number.isInteger(${value})`;
    if (IsNumber$2(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber$2(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber$2(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber$2(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber$2(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromIntersect2(schema, references, value) {
    const check1 = schema.allOf.map((schema2) => CreateExpression(schema2, references, value)).join(" && ");
    if (schema.unevaluatedProperties === false) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key))`;
      yield `(${check1} && ${check2})`;
    } else if (IsSchema(schema.unevaluatedProperties)) {
      const keyCheck = CreateVariable(`${new RegExp(KeyOfPattern(schema))};`);
      const check2 = `Object.getOwnPropertyNames(${value}).every(key => ${keyCheck}.test(key) || ${CreateExpression(schema.unevaluatedProperties, references, `${value}[key]`)})`;
      yield `(${check1} && ${check2})`;
    } else {
      yield `(${check1})`;
    }
  }
  function* FromIterator2(schema, references, value) {
    yield `(typeof value === 'object' && Symbol.iterator in ${value})`;
  }
  function* FromLiteral2(schema, references, value) {
    if (typeof schema.const === "number" || typeof schema.const === "boolean") {
      yield `(${value} === ${schema.const})`;
    } else {
      yield `(${value} === '${LiteralString.Escape(schema.const)}')`;
    }
  }
  function* FromNever2(schema, references, value) {
    yield `false`;
  }
  function* FromNot2(schema, references, value) {
    const expression = CreateExpression(schema.not, references, value);
    yield `(!${expression})`;
  }
  function* FromNull2(schema, references, value) {
    yield `(${value} === null)`;
  }
  function* FromNumber2(schema, references, value) {
    yield Policy.IsNumberLike(value);
    if (IsNumber$2(schema.exclusiveMaximum))
      yield `${value} < ${schema.exclusiveMaximum}`;
    if (IsNumber$2(schema.exclusiveMinimum))
      yield `${value} > ${schema.exclusiveMinimum}`;
    if (IsNumber$2(schema.maximum))
      yield `${value} <= ${schema.maximum}`;
    if (IsNumber$2(schema.minimum))
      yield `${value} >= ${schema.minimum}`;
    if (IsNumber$2(schema.multipleOf))
      yield `(${value} % ${schema.multipleOf}) === 0`;
  }
  function* FromObject2(schema, references, value) {
    yield Policy.IsObjectLike(value);
    if (IsNumber$2(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber$2(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const knownKeys = Object.getOwnPropertyNames(schema.properties);
    for (const knownKey of knownKeys) {
      const memberExpression = MemberExpression.Encode(value, knownKey);
      const property = schema.properties[knownKey];
      if (schema.required && schema.required.includes(knownKey)) {
        yield* Visit2(property, references, memberExpression);
        if (ExtendsUndefinedCheck(property) || IsAnyOrUnknown2(property))
          yield `('${knownKey}' in ${value})`;
      } else {
        const expression = CreateExpression(property, references, memberExpression);
        yield Policy.IsExactOptionalProperty(value, knownKey, expression);
      }
    }
    if (schema.additionalProperties === false) {
      if (schema.required && schema.required.length === knownKeys.length) {
        yield `Object.getOwnPropertyNames(${value}).length === ${knownKeys.length}`;
      } else {
        const keys = `[${knownKeys.map((key) => `'${key}'`).join(", ")}]`;
        yield `Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key))`;
      }
    }
    if (typeof schema.additionalProperties === "object") {
      const expression = CreateExpression(schema.additionalProperties, references, `${value}[key]`);
      const keys = `[${knownKeys.map((key) => `'${key}'`).join(", ")}]`;
      yield `(Object.getOwnPropertyNames(${value}).every(key => ${keys}.includes(key) || ${expression}))`;
    }
  }
  function* FromPromise2(schema, references, value) {
    yield `(typeof value === 'object' && typeof ${value}.then === 'function')`;
  }
  function* FromRecord2(schema, references, value) {
    yield Policy.IsRecordLike(value);
    if (IsNumber$2(schema.minProperties))
      yield `Object.getOwnPropertyNames(${value}).length >= ${schema.minProperties}`;
    if (IsNumber$2(schema.maxProperties))
      yield `Object.getOwnPropertyNames(${value}).length <= ${schema.maxProperties}`;
    const [patternKey, patternSchema] = Object.entries(schema.patternProperties)[0];
    const variable = CreateVariable(`${new RegExp(patternKey)}`);
    const check1 = CreateExpression(patternSchema, references, "value");
    const check2 = IsSchema(schema.additionalProperties) ? CreateExpression(schema.additionalProperties, references, value) : schema.additionalProperties === false ? "false" : "true";
    const expression = `(${variable}.test(key) ? ${check1} : ${check2})`;
    yield `(Object.entries(${value}).every(([key, value]) => ${expression}))`;
  }
  function* FromRef2(schema, references, value) {
    const target = Deref(schema, references);
    if (state.functions.has(schema.$ref))
      return yield `${CreateFunctionName(schema.$ref)}(${value})`;
    yield* Visit2(target, references, value);
  }
  function* FromRegExp2(schema, references, value) {
    const variable = CreateVariable(`${new RegExp(schema.source, schema.flags)};`);
    yield `(typeof ${value} === 'string')`;
    if (IsNumber$2(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber$2(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    yield `${variable}.test(${value})`;
  }
  function* FromString2(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    if (IsNumber$2(schema.maxLength))
      yield `${value}.length <= ${schema.maxLength}`;
    if (IsNumber$2(schema.minLength))
      yield `${value}.length >= ${schema.minLength}`;
    if (schema.pattern !== void 0) {
      const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
      yield `${variable}.test(${value})`;
    }
    if (schema.format !== void 0) {
      yield `format('${schema.format}', ${value})`;
    }
  }
  function* FromSymbol2(schema, references, value) {
    yield `(typeof ${value} === 'symbol')`;
  }
  function* FromTemplateLiteral2(schema, references, value) {
    yield `(typeof ${value} === 'string')`;
    const variable = CreateVariable(`${new RegExp(schema.pattern)};`);
    yield `${variable}.test(${value})`;
  }
  function* FromThis2(schema, references, value) {
    yield `${CreateFunctionName(schema.$ref)}(${value})`;
  }
  function* FromTuple2(schema, references, value) {
    yield `Array.isArray(${value})`;
    if (schema.items === void 0)
      return yield `${value}.length === 0`;
    yield `(${value}.length === ${schema.maxItems})`;
    for (let i = 0; i < schema.items.length; i++) {
      const expression = CreateExpression(schema.items[i], references, `${value}[${i}]`);
      yield `${expression}`;
    }
  }
  function* FromUndefined2(schema, references, value) {
    yield `${value} === undefined`;
  }
  function* FromUnion2(schema, references, value) {
    const expressions = schema.anyOf.map((schema2) => CreateExpression(schema2, references, value));
    yield `(${expressions.join(" || ")})`;
  }
  function* FromUint8Array2(schema, references, value) {
    yield `${value} instanceof Uint8Array`;
    if (IsNumber$2(schema.maxByteLength))
      yield `(${value}.length <= ${schema.maxByteLength})`;
    if (IsNumber$2(schema.minByteLength))
      yield `(${value}.length >= ${schema.minByteLength})`;
  }
  function* FromUnknown2(schema, references, value) {
    yield "true";
  }
  function* FromVoid2(schema, references, value) {
    yield Policy.IsVoidLike(value);
  }
  function* FromKind2(schema, references, value) {
    const instance = state.instances.size;
    state.instances.set(instance, schema);
    yield `kind('${schema[Kind$1]}', ${instance}, ${value})`;
  }
  function* Visit2(schema, references, value, useHoisting = true) {
    const references_ = IsString$2(schema.$id) ? [...references, schema] : references;
    const schema_ = schema;
    if (useHoisting && IsString$2(schema.$id)) {
      const functionName = CreateFunctionName(schema.$id);
      if (state.functions.has(functionName)) {
        return yield `${functionName}(${value})`;
      } else {
        state.functions.set(functionName, "<deferred>");
        const functionCode = CreateFunction(functionName, schema, references, "value", false);
        state.functions.set(functionName, functionCode);
        return yield `${functionName}(${value})`;
      }
    }
    switch (schema_[Kind$1]) {
      case "Any":
        return yield* FromAny2();
      case "Array":
        return yield* FromArray2(schema_, references_, value);
      case "AsyncIterator":
        return yield* FromAsyncIterator2(schema_, references_, value);
      case "BigInt":
        return yield* FromBigInt2(schema_, references_, value);
      case "Boolean":
        return yield* FromBoolean2(schema_, references_, value);
      case "Constructor":
        return yield* FromConstructor2(schema_, references_, value);
      case "Date":
        return yield* FromDate2(schema_, references_, value);
      case "Function":
        return yield* FromFunction2(schema_, references_, value);
      case "Import":
        return yield* FromImport2(schema_, references_, value);
      case "Integer":
        return yield* FromInteger2(schema_, references_, value);
      case "Intersect":
        return yield* FromIntersect2(schema_, references_, value);
      case "Iterator":
        return yield* FromIterator2(schema_, references_, value);
      case "Literal":
        return yield* FromLiteral2(schema_, references_, value);
      case "Never":
        return yield* FromNever2();
      case "Not":
        return yield* FromNot2(schema_, references_, value);
      case "Null":
        return yield* FromNull2(schema_, references_, value);
      case "Number":
        return yield* FromNumber2(schema_, references_, value);
      case "Object":
        return yield* FromObject2(schema_, references_, value);
      case "Promise":
        return yield* FromPromise2(schema_, references_, value);
      case "Record":
        return yield* FromRecord2(schema_, references_, value);
      case "Ref":
        return yield* FromRef2(schema_, references_, value);
      case "RegExp":
        return yield* FromRegExp2(schema_, references_, value);
      case "String":
        return yield* FromString2(schema_, references_, value);
      case "Symbol":
        return yield* FromSymbol2(schema_, references_, value);
      case "TemplateLiteral":
        return yield* FromTemplateLiteral2(schema_, references_, value);
      case "This":
        return yield* FromThis2(schema_, references_, value);
      case "Tuple":
        return yield* FromTuple2(schema_, references_, value);
      case "Undefined":
        return yield* FromUndefined2(schema_, references_, value);
      case "Union":
        return yield* FromUnion2(schema_, references_, value);
      case "Uint8Array":
        return yield* FromUint8Array2(schema_, references_, value);
      case "Unknown":
        return yield* FromUnknown2();
      case "Void":
        return yield* FromVoid2(schema_, references_, value);
      default:
        if (!Has(schema_[Kind$1]))
          throw new TypeCompilerUnknownTypeError(schema);
        return yield* FromKind2(schema_, references_, value);
    }
  }
  const state = {
    language: "javascript",
    // target language
    functions: /* @__PURE__ */ new Map(),
    // local functions
    variables: /* @__PURE__ */ new Map(),
    // local variables
    instances: /* @__PURE__ */ new Map()
    // exterior kind instances
  };
  function CreateExpression(schema, references, value, useHoisting = true) {
    return `(${[...Visit2(schema, references, value, useHoisting)].join(" && ")})`;
  }
  function CreateFunctionName($id) {
    return `check_${Identifier.Encode($id)}`;
  }
  function CreateVariable(expression) {
    const variableName = `local_${state.variables.size}`;
    state.variables.set(variableName, `const ${variableName} = ${expression}`);
    return variableName;
  }
  function CreateFunction(name, schema, references, value, useHoisting = true) {
    const [newline, pad] = ["\n", (length) => "".padStart(length, " ")];
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const expression = [...Visit2(schema, references, value, useHoisting)].map((expression2) => `${pad(4)}${expression2}`).join(` &&${newline}`);
    return `function ${name}(${parameter})${returns} {${newline}${pad(2)}return (${newline}${expression}${newline}${pad(2)})
}`;
  }
  function CreateParameter(name, type2) {
    const annotation = state.language === "typescript" ? `: ${type2}` : "";
    return `${name}${annotation}`;
  }
  function CreateReturns(type2) {
    return state.language === "typescript" ? `: ${type2}` : "";
  }
  function Build(schema, references, options) {
    const functionCode = CreateFunction("check", schema, references, "value");
    const parameter = CreateParameter("value", "any");
    const returns = CreateReturns("boolean");
    const functions = [...state.functions.values()];
    const variables = [...state.variables.values()];
    const checkFunction = IsString$2(schema.$id) ? `return function check(${parameter})${returns} {
  return ${CreateFunctionName(schema.$id)}(value)
}` : `return ${functionCode}`;
    return [...variables, ...functions, checkFunction].join("\n");
  }
  function Code(...args) {
    const defaults = { language: "javascript" };
    const [schema, references, options] = args.length === 2 && IsArray$2(args[1]) ? [args[0], args[1], defaults] : args.length === 2 && !IsArray$2(args[1]) ? [args[0], [], args[1]] : args.length === 3 ? [args[0], args[1], args[2]] : args.length === 1 ? [args[0], [], defaults] : [null, [], defaults];
    state.language = options.language;
    state.variables.clear();
    state.functions.clear();
    state.instances.clear();
    if (!IsSchema(schema))
      throw new TypeCompilerTypeGuardError(schema);
    for (const schema2 of references)
      if (!IsSchema(schema2))
        throw new TypeCompilerTypeGuardError(schema2);
    return Build(schema, references);
  }
  TypeCompiler2.Code = Code;
  function Compile(schema, references = []) {
    const generatedCode = Code(schema, references, { language: "javascript" });
    const compiledFunction = globalThis.Function("kind", "format", "hash", generatedCode);
    const instances = new Map(state.instances);
    function typeRegistryFunction(kind, instance, value) {
      if (!Has(kind) || !instances.has(instance))
        return false;
      const checkFunc = Get(kind);
      const schema2 = instances.get(instance);
      return checkFunc(schema2, value);
    }
    function formatRegistryFunction(format, value) {
      if (!Has$1(format))
        return false;
      const checkFunc = Get$1(format);
      return checkFunc(value);
    }
    function hashFunction(value) {
      return Hash(value);
    }
    const checkFunction = compiledFunction(typeRegistryFunction, formatRegistryFunction, hashFunction);
    return new TypeCheck(schema, references, checkFunction, generatedCode);
  }
  TypeCompiler2.Compile = Compile;
})(TypeCompiler || (TypeCompiler = {}));
function FromObject$3(value) {
  const Acc = {};
  for (const key of Object.getOwnPropertyNames(value)) {
    Acc[key] = Clone(value[key]);
  }
  for (const key of Object.getOwnPropertySymbols(value)) {
    Acc[key] = Clone(value[key]);
  }
  return Acc;
}
function FromArray$3(value) {
  return value.map((element) => Clone(element));
}
function FromTypedArray(value) {
  return value.slice();
}
function FromMap(value) {
  return new Map(Clone([...value.entries()]));
}
function FromSet(value) {
  return new Set(Clone([...value.entries()]));
}
function FromDate$2(value) {
  return new Date(value.toISOString());
}
function FromValue(value) {
  return value;
}
function Clone(value) {
  if (IsArray$2(value))
    return FromArray$3(value);
  if (IsDate$2(value))
    return FromDate$2(value);
  if (IsTypedArray(value))
    return FromTypedArray(value);
  if (IsMap(value))
    return FromMap(value);
  if (IsSet(value))
    return FromSet(value);
  if (IsObject$2(value))
    return FromObject$3(value);
  if (IsValueType(value))
    return FromValue(value);
  throw new Error("ValueClone: Unable to clone value");
}
class ValueCreateError extends TypeBoxError {
  constructor(schema, message) {
    super(message);
    this.schema = schema;
  }
}
function FromDefault(value) {
  return IsFunction$2(value) ? value() : Clone(value);
}
function FromAny(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromArray$2(schema, references) {
  if (schema.uniqueItems === true && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the uniqueItems constraint requires a default value");
  } else if ("contains" in schema && !HasPropertyKey(schema, "default")) {
    throw new ValueCreateError(schema, "Array with the contains constraint requires a default value");
  } else if ("default" in schema) {
    return FromDefault(schema.default);
  } else if (schema.minItems !== void 0) {
    return Array.from({ length: schema.minItems }).map((item) => {
      return Visit$2(schema.items, references);
    });
  } else {
    return [];
  }
}
function FromAsyncIterator(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return async function* () {
    }();
  }
}
function FromBigInt(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return BigInt(0);
  }
}
function FromBoolean(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return false;
  }
}
function FromConstructor(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = Visit$2(schema.returns, references);
    if (typeof value === "object" && !Array.isArray(value)) {
      return class {
        constructor() {
          for (const [key, val] of Object.entries(value)) {
            const self = this;
            self[key] = val;
          }
        }
      };
    } else {
      return class {
      };
    }
  }
}
function FromDate$1(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimumTimestamp !== void 0) {
    return new Date(schema.minimumTimestamp);
  } else {
    return /* @__PURE__ */ new Date();
  }
}
function FromFunction(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return () => Visit$2(schema.returns, references);
  }
}
function FromImport$2(schema, references) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$2(target, [...references, ...definitions]);
}
function FromInteger(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== void 0) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromIntersect$2(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const value = schema.allOf.reduce((acc, schema2) => {
      const next2 = Visit$2(schema2, references);
      return typeof next2 === "object" ? { ...acc, ...next2 } : next2;
    }, {});
    if (!Check(schema, references, value))
      throw new ValueCreateError(schema, "Intersect produced invalid value. Consider using a default value.");
    return value;
  }
}
function FromIterator(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return function* () {
    }();
  }
}
function FromLiteral(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return schema.const;
  }
}
function FromNever(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Never types cannot be created. Consider using a default value.");
  }
}
function FromNot(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "Not types must have a default value");
  }
}
function FromNull(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return null;
  }
}
function FromNumber(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minimum !== void 0) {
    return schema.minimum;
  } else {
    return 0;
  }
}
function FromObject$2(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    const required = new Set(schema.required);
    const Acc = {};
    for (const [key, subschema] of Object.entries(schema.properties)) {
      if (!required.has(key))
        continue;
      Acc[key] = Visit$2(subschema, references);
    }
    return Acc;
  }
}
function FromPromise(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Promise.resolve(Visit$2(schema.item, references));
  }
}
function FromRecord$2(schema, references) {
  const [keyPattern, valueSchema] = Object.entries(schema.patternProperties)[0];
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (!(keyPattern === PatternStringExact || keyPattern === PatternNumberExact)) {
    const propertyKeys = keyPattern.slice(1, keyPattern.length - 1).split("|");
    const Acc = {};
    for (const key of propertyKeys)
      Acc[key] = Visit$2(valueSchema, references);
    return Acc;
  } else {
    return {};
  }
}
function FromRef$2(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit$2(Deref(schema, references), references);
  }
}
function FromRegExp(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new ValueCreateError(schema, "RegExp types cannot be created. Consider using a default value.");
  }
}
function FromString(schema, references) {
  if (schema.pattern !== void 0) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with patterns must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else if (schema.format !== void 0) {
    if (!HasPropertyKey(schema, "default")) {
      throw new ValueCreateError(schema, "String types with formats must specify a default value");
    } else {
      return FromDefault(schema.default);
    }
  } else {
    if (HasPropertyKey(schema, "default")) {
      return FromDefault(schema.default);
    } else if (schema.minLength !== void 0) {
      return Array.from({ length: schema.minLength }).map(() => " ").join("");
    } else {
      return "";
    }
  }
}
function FromSymbol(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if ("value" in schema) {
    return Symbol.for(schema.value);
  } else {
    return Symbol();
  }
}
function FromTemplateLiteral(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (!IsTemplateLiteralFinite(schema))
    throw new ValueCreateError(schema, "Can only create template literals that produce a finite variants. Consider using a default value.");
  const generated = TemplateLiteralGenerate(schema);
  return generated[0];
}
function FromThis$2(schema, references) {
  if (recursiveDepth++ > recursiveMaxDepth)
    throw new ValueCreateError(schema, "Cannot create recursive type as it appears possibly infinite. Consider using a default.");
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return Visit$2(Deref(schema, references), references);
  }
}
function FromTuple$2(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  }
  if (schema.items === void 0) {
    return [];
  } else {
    return Array.from({ length: schema.minItems }).map((_, index) => Visit$2(schema.items[index], references));
  }
}
function FromUndefined(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return void 0;
  }
}
function FromUnion$2(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.anyOf.length === 0) {
    throw new Error("ValueCreate.Union: Cannot create Union with zero variants");
  } else {
    return Visit$2(schema.anyOf[0], references);
  }
}
function FromUint8Array(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else if (schema.minByteLength !== void 0) {
    return new Uint8Array(schema.minByteLength);
  } else {
    return new Uint8Array(0);
  }
}
function FromUnknown(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return {};
  }
}
function FromVoid(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    return void 0;
  }
}
function FromKind(schema, references) {
  if (HasPropertyKey(schema, "default")) {
    return FromDefault(schema.default);
  } else {
    throw new Error("User defined types must specify a default value");
  }
}
function Visit$2(schema, references) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Any":
      return FromAny(schema_);
    case "Array":
      return FromArray$2(schema_, references_);
    case "AsyncIterator":
      return FromAsyncIterator(schema_);
    case "BigInt":
      return FromBigInt(schema_);
    case "Boolean":
      return FromBoolean(schema_);
    case "Constructor":
      return FromConstructor(schema_, references_);
    case "Date":
      return FromDate$1(schema_);
    case "Function":
      return FromFunction(schema_, references_);
    case "Import":
      return FromImport$2(schema_, references_);
    case "Integer":
      return FromInteger(schema_);
    case "Intersect":
      return FromIntersect$2(schema_, references_);
    case "Iterator":
      return FromIterator(schema_);
    case "Literal":
      return FromLiteral(schema_);
    case "Never":
      return FromNever(schema_);
    case "Not":
      return FromNot(schema_);
    case "Null":
      return FromNull(schema_);
    case "Number":
      return FromNumber(schema_);
    case "Object":
      return FromObject$2(schema_, references_);
    case "Promise":
      return FromPromise(schema_, references_);
    case "Record":
      return FromRecord$2(schema_, references_);
    case "Ref":
      return FromRef$2(schema_, references_);
    case "RegExp":
      return FromRegExp(schema_);
    case "String":
      return FromString(schema_);
    case "Symbol":
      return FromSymbol(schema_);
    case "TemplateLiteral":
      return FromTemplateLiteral(schema_);
    case "This":
      return FromThis$2(schema_, references_);
    case "Tuple":
      return FromTuple$2(schema_, references_);
    case "Undefined":
      return FromUndefined(schema_);
    case "Union":
      return FromUnion$2(schema_, references_);
    case "Uint8Array":
      return FromUint8Array(schema_);
    case "Unknown":
      return FromUnknown(schema_);
    case "Void":
      return FromVoid(schema_);
    default:
      if (!Has(schema_[Kind$1]))
        throw new ValueCreateError(schema_, "Unknown type");
      return FromKind(schema_);
  }
}
const recursiveMaxDepth = 512;
let recursiveDepth = 0;
function Create(...args) {
  recursiveDepth = 0;
  return args.length === 2 ? Visit$2(args[0], args[1]) : Visit$2(args[0], []);
}
function IsCheckable(schema) {
  return IsKind$1(schema) && schema[Kind$1] !== "Unsafe";
}
function FromArray$1(schema, references, value) {
  if (!IsArray$2(value))
    return value;
  return value.map((value2) => Visit$1(schema.items, references, value2));
}
function FromImport$1(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit$1(target, [...references, ...definitions], value);
}
function FromIntersect$1(schema, references, value) {
  const unevaluatedProperties = schema.unevaluatedProperties;
  const intersections = schema.allOf.map((schema2) => Visit$1(schema2, references, Clone(value)));
  const composite = intersections.reduce((acc, value2) => IsObject$2(value2) ? { ...acc, ...value2 } : value2, {});
  if (!IsObject$2(value) || !IsObject$2(composite) || !IsKind$1(unevaluatedProperties))
    return composite;
  const knownkeys = KeyOfPropertyKeys(schema);
  for (const key of Object.getOwnPropertyNames(value)) {
    if (knownkeys.includes(key))
      continue;
    if (Check(unevaluatedProperties, references, value[key])) {
      composite[key] = Visit$1(unevaluatedProperties, references, value[key]);
    }
  }
  return composite;
}
function FromObject$1(schema, references, value) {
  if (!IsObject$2(value) || IsArray$2(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  for (const key of Object.getOwnPropertyNames(value)) {
    if (HasPropertyKey(schema.properties, key)) {
      value[key] = Visit$1(schema.properties[key], references, value[key]);
      continue;
    }
    if (IsKind$1(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit$1(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRecord$1(schema, references, value) {
  if (!IsObject$2(value))
    return value;
  const additionalProperties = schema.additionalProperties;
  const propertyKeys = Object.getOwnPropertyNames(value);
  const [propertyKey, propertySchema] = Object.entries(schema.patternProperties)[0];
  const propertyKeyTest = new RegExp(propertyKey);
  for (const key of propertyKeys) {
    if (propertyKeyTest.test(key)) {
      value[key] = Visit$1(propertySchema, references, value[key]);
      continue;
    }
    if (IsKind$1(additionalProperties) && Check(additionalProperties, references, value[key])) {
      value[key] = Visit$1(additionalProperties, references, value[key]);
      continue;
    }
    delete value[key];
  }
  return value;
}
function FromRef$1(schema, references, value) {
  return Visit$1(Deref(schema, references), references, value);
}
function FromThis$1(schema, references, value) {
  return Visit$1(Deref(schema, references), references, value);
}
function FromTuple$1(schema, references, value) {
  if (!IsArray$2(value))
    return value;
  if (IsUndefined$2(schema.items))
    return [];
  const length = Math.min(value.length, schema.items.length);
  for (let i = 0; i < length; i++) {
    value[i] = Visit$1(schema.items[i], references, value[i]);
  }
  return value.length > length ? value.slice(0, length) : value;
}
function FromUnion$1(schema, references, value) {
  for (const inner of schema.anyOf) {
    if (IsCheckable(inner) && Check(inner, references, value)) {
      return Visit$1(inner, references, value);
    }
  }
  return value;
}
function Visit$1(schema, references, value) {
  const references_ = IsString$2(schema.$id) ? Pushref(schema, references) : references;
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Array":
      return FromArray$1(schema_, references_, value);
    case "Import":
      return FromImport$1(schema_, references_, value);
    case "Intersect":
      return FromIntersect$1(schema_, references_, value);
    case "Object":
      return FromObject$1(schema_, references_, value);
    case "Record":
      return FromRecord$1(schema_, references_, value);
    case "Ref":
      return FromRef$1(schema_, references_, value);
    case "This":
      return FromThis$1(schema_, references_, value);
    case "Tuple":
      return FromTuple$1(schema_, references_, value);
    case "Union":
      return FromUnion$1(schema_, references_, value);
    default:
      return value;
  }
}
function Clean(...args) {
  return args.length === 3 ? Visit$1(args[0], args[1], args[2]) : Visit$1(args[0], [], args[1]);
}
function Decode(...args) {
  const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  if (!Check(schema, references, value))
    throw new TransformDecodeCheckError(schema, value, Errors(schema, references, value).First());
  return HasTransform(schema, references) ? TransformDecode(schema, references, value) : value;
}
function ValueOrDefault(schema, value) {
  const defaultValue = HasPropertyKey(schema, "default") ? schema.default : void 0;
  const clone = IsFunction$2(defaultValue) ? defaultValue() : Clone(defaultValue);
  return IsUndefined$2(value) ? clone : IsObject$2(value) && IsObject$2(clone) ? Object.assign(clone, value) : value;
}
function HasDefaultProperty(schema) {
  return IsKind$1(schema) && "default" in schema;
}
function FromArray(schema, references, value) {
  if (IsArray$2(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = Visit(schema.items, references, value[i]);
    }
    return value;
  }
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray$2(defaulted))
    return defaulted;
  for (let i = 0; i < defaulted.length; i++) {
    defaulted[i] = Visit(schema.items, references, defaulted[i]);
  }
  return defaulted;
}
function FromDate(schema, references, value) {
  return IsDate$2(value) ? value : ValueOrDefault(schema, value);
}
function FromImport(schema, references, value) {
  const definitions = globalThis.Object.values(schema.$defs);
  const target = schema.$defs[schema.$ref];
  return Visit(target, [...references, ...definitions], value);
}
function FromIntersect(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  return schema.allOf.reduce((acc, schema2) => {
    const next2 = Visit(schema2, references, defaulted);
    return IsObject$2(next2) ? { ...acc, ...next2 } : next2;
  }, {});
}
function FromObject(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const knownPropertyKeys = Object.getOwnPropertyNames(schema.properties);
  for (const key of knownPropertyKeys) {
    const propertyValue = Visit(schema.properties[key], references, defaulted[key]);
    if (IsUndefined$2(propertyValue))
      continue;
    defaulted[key] = Visit(schema.properties[key], references, defaulted[key]);
  }
  if (!HasDefaultProperty(schema.additionalProperties))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKeys.includes(key))
      continue;
    defaulted[key] = Visit(schema.additionalProperties, references, defaulted[key]);
  }
  return defaulted;
}
function FromRecord(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsObject$2(defaulted))
    return defaulted;
  const additionalPropertiesSchema = schema.additionalProperties;
  const [propertyKeyPattern, propertySchema] = Object.entries(schema.patternProperties)[0];
  const knownPropertyKey = new RegExp(propertyKeyPattern);
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (!(knownPropertyKey.test(key) && HasDefaultProperty(propertySchema)))
      continue;
    defaulted[key] = Visit(propertySchema, references, defaulted[key]);
  }
  if (!HasDefaultProperty(additionalPropertiesSchema))
    return defaulted;
  for (const key of Object.getOwnPropertyNames(defaulted)) {
    if (knownPropertyKey.test(key))
      continue;
    defaulted[key] = Visit(additionalPropertiesSchema, references, defaulted[key]);
  }
  return defaulted;
}
function FromRef(schema, references, value) {
  return Visit(Deref(schema, references), references, ValueOrDefault(schema, value));
}
function FromThis(schema, references, value) {
  return Visit(Deref(schema, references), references, value);
}
function FromTuple(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  if (!IsArray$2(defaulted) || IsUndefined$2(schema.items))
    return defaulted;
  const [items, max] = [schema.items, Math.max(schema.items.length, defaulted.length)];
  for (let i = 0; i < max; i++) {
    if (i < items.length)
      defaulted[i] = Visit(items[i], references, defaulted[i]);
  }
  return defaulted;
}
function FromUnion(schema, references, value) {
  const defaulted = ValueOrDefault(schema, value);
  for (const inner of schema.anyOf) {
    const result = Visit(inner, references, Clone(defaulted));
    if (Check(inner, references, result)) {
      return result;
    }
  }
  return defaulted;
}
function Visit(schema, references, value) {
  const references_ = Pushref(schema, references);
  const schema_ = schema;
  switch (schema_[Kind$1]) {
    case "Array":
      return FromArray(schema_, references_, value);
    case "Date":
      return FromDate(schema_, references_, value);
    case "Import":
      return FromImport(schema_, references_, value);
    case "Intersect":
      return FromIntersect(schema_, references_, value);
    case "Object":
      return FromObject(schema_, references_, value);
    case "Record":
      return FromRecord(schema_, references_, value);
    case "Ref":
      return FromRef(schema_, references_, value);
    case "This":
      return FromThis(schema_, references_, value);
    case "Tuple":
      return FromTuple(schema_, references_, value);
    case "Union":
      return FromUnion(schema_, references_, value);
    default:
      return ValueOrDefault(schema_, value);
  }
}
function Default(...args) {
  return args.length === 3 ? Visit(args[0], args[1], args[2]) : Visit(args[0], [], args[1]);
}
function Encode(...args) {
  const [schema, references, value] = args.length === 3 ? [args[0], args[1], args[2]] : [args[0], [], args[1]];
  const encoded = HasTransform(schema, references) ? TransformEncode(schema, references, value) : value;
  if (!Check(schema, references, encoded))
    throw new TransformEncodeCheckError(schema, encoded, Errors(schema, references, encoded).First());
  return encoded;
}
const fullFormats = {
  // date: http://tools.ietf.org/html/rfc3339#section-5.6
  date,
  // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
  time: getTime(true),
  "date-time": getDateTime(true),
  "iso-time": getTime(false),
  "iso-date-time": getDateTime(false),
  // duration: https://tools.ietf.org/html/rfc3339#appendix-A
  duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
  uri,
  "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
  // uri-template: https://tools.ietf.org/html/rfc6570
  "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
  // For the source: https://gist.github.com/dperini/729294
  // For test cases: https://mathiasbynens.be/demo/url-regex
  url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
  email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
  hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
  // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
  ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
  ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
  regex,
  // uuid: http://tools.ietf.org/html/rfc4122
  uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
  // JSON-pointer: https://tools.ietf.org/html/rfc6901
  // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
  "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
  "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
  // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
  "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
  // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
  // byte: https://github.com/miguelmota/is-base64
  byte,
  // signed 32 bit integer
  int32: { type: "number", validate: validateInt32 },
  // signed 64 bit integer
  int64: { type: "number", validate: validateInt64 },
  // C-type float
  float: { type: "number", validate: validateNumber },
  // C-type double
  double: { type: "number", validate: validateNumber },
  // hint to the UI to hide input strings
  password: true,
  // unchecked string payload
  binary: true
};
function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function date(str) {
  const matches = DATE.exec(str);
  if (!matches) return false;
  const year = +matches[1];
  const month = +matches[2];
  const day = +matches[3];
  return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
}
const TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
function getTime(strictTimeZone) {
  return function time(str) {
    const matches = TIME.exec(str);
    if (!matches) return false;
    const hr = +matches[1];
    const min = +matches[2];
    const sec = +matches[3];
    const tz = matches[4];
    const tzSign = matches[5] === "-" ? -1 : 1;
    const tzH = +(matches[6] || 0);
    const tzM = +(matches[7] || 0);
    if (tzH > 23 || tzM > 59 || strictTimeZone && !tz) return false;
    if (hr <= 23 && min <= 59 && sec < 60) return true;
    const utcMin = min - tzM * tzSign;
    const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
    return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
  };
}
const DATE_TIME_SEPARATOR = /t|\s/i;
function getDateTime(strictTimeZone) {
  const time = getTime(strictTimeZone);
  return function date_time(str) {
    const dateTime = str.split(DATE_TIME_SEPARATOR);
    return dateTime.length === 2 && date(dateTime[0]) && time(dateTime[1]);
  };
}
const NOT_URI_FRAGMENT = /\/|:/;
const URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
function uri(str) {
  return NOT_URI_FRAGMENT.test(str) && URI.test(str);
}
const BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
function byte(str) {
  BYTE.lastIndex = 0;
  return BYTE.test(str);
}
const MIN_INT32 = -2147483648;
const MAX_INT32 = 2 ** 31 - 1;
function validateInt32(value) {
  return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
}
function validateInt64(value) {
  return Number.isInteger(value);
}
function validateNumber() {
  return true;
}
const Z_ANCHOR = /[^\\]\\Z/;
function regex(str) {
  if (Z_ANCHOR.test(str)) return false;
  try {
    new RegExp(str);
    return true;
  } catch (e) {
    return false;
  }
}
const hasHeaderShorthand = "toJSON" in new Headers();
const replaceUrlPath = (url, pathname) => {
  const urlObject = new URL(url);
  urlObject.pathname = pathname;
  return urlObject.toString();
};
const isClass = (v) => typeof v === "function" && /^\s*class\s+/.test(v.toString()) || // Handle import * as Sentry from '@sentry/bun'
// This also handle [object Date], [object Array]
// and FFI value like [object Prisma]
v.toString().startsWith("[object ") && v.toString() !== "[object Object]" || // If object prototype is not pure, then probably a class-like object
isNotEmpty(Object.getPrototypeOf(v));
const isObject = (item) => item && typeof item === "object" && !Array.isArray(item);
const mergeDeep = (target, source, {
  skipKeys,
  override = true
} = {}) => {
  if (!isObject(target) || !isObject(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (skipKeys == null ? void 0 : skipKeys.includes(key)) continue;
    if (!isObject(value) || !(key in target) || isClass(value)) {
      if (override || !(key in target))
        target[key] = value;
      continue;
    }
    target[key] = mergeDeep(
      target[key],
      value,
      { skipKeys, override }
    );
  }
  return target;
};
const mergeCookie = (a2, b) => {
  const { properties: _, ...target } = a2 ?? {};
  const { properties: __, ...source } = b ?? {};
  return mergeDeep(target, source);
};
const mergeObjectArray = (a2 = [], b = []) => {
  if (!a2) return [];
  if (!b) return a2;
  const array = [];
  const checksums = [];
  if (!Array.isArray(a2)) a2 = [a2];
  if (!Array.isArray(b)) b = [b];
  for (const item of a2) {
    array.push(item);
    if (item.checksum) checksums.push(item.checksum);
  }
  for (const item of b)
    if (!checksums.includes(item.checksum)) array.push(item);
  return array;
};
const primitiveHooks = [
  "start",
  "request",
  "parse",
  "transform",
  "resolve",
  "beforeHandle",
  "afterHandle",
  "mapResponse",
  "afterResponse",
  "trace",
  "error",
  "stop",
  "body",
  "headers",
  "params",
  "query",
  "response",
  "type",
  "detail"
];
const primitiveHookMap = primitiveHooks.reduce(
  (acc, x) => (acc[x] = true, acc),
  {}
);
const mergeResponse = (a2, b) => {
  const isRecordNumber = (x) => typeof x === "object" && Object.keys(x).every(isNumericString);
  if (isRecordNumber(a2) && isRecordNumber(b))
    return { ...a2, ...b };
  else if (a2 && !isRecordNumber(a2) && isRecordNumber(b))
    return { 200: a2, ...b };
  return b ?? a2;
};
const mergeSchemaValidator = (a2, b) => {
  return {
    body: (b == null ? void 0 : b.body) ?? (a2 == null ? void 0 : a2.body),
    headers: (b == null ? void 0 : b.headers) ?? (a2 == null ? void 0 : a2.headers),
    params: (b == null ? void 0 : b.params) ?? (a2 == null ? void 0 : a2.params),
    query: (b == null ? void 0 : b.query) ?? (a2 == null ? void 0 : a2.query),
    cookie: (b == null ? void 0 : b.cookie) ?? (a2 == null ? void 0 : a2.cookie),
    // @ts-ignore ? This order is correct - SaltyAom
    response: mergeResponse(
      // @ts-ignore
      a2 == null ? void 0 : a2.response,
      // @ts-ignore
      b == null ? void 0 : b.response
    )
  };
};
const mergeHook = (a2, b) => {
  const { resolve: resolveA, ...restA } = a2 ?? {};
  const { resolve: resolveB, ...restB } = b ?? {};
  return {
    ...restA,
    ...restB,
    // Merge local hook first
    // @ts-ignore
    body: (b == null ? void 0 : b.body) ?? (a2 == null ? void 0 : a2.body),
    // @ts-ignore
    headers: (b == null ? void 0 : b.headers) ?? (a2 == null ? void 0 : a2.headers),
    // @ts-ignore
    params: (b == null ? void 0 : b.params) ?? (a2 == null ? void 0 : a2.params),
    // @ts-ignore
    query: (b == null ? void 0 : b.query) ?? (a2 == null ? void 0 : a2.query),
    // @ts-ignore
    cookie: (b == null ? void 0 : b.cookie) ?? (a2 == null ? void 0 : a2.cookie),
    // ? This order is correct - SaltyAom
    response: mergeResponse(
      // @ts-ignore
      a2 == null ? void 0 : a2.response,
      // @ts-ignore
      b == null ? void 0 : b.response
    ),
    type: (a2 == null ? void 0 : a2.type) || (b == null ? void 0 : b.type),
    detail: mergeDeep(
      // @ts-ignore
      (b == null ? void 0 : b.detail) ?? {},
      // @ts-ignore
      (a2 == null ? void 0 : a2.detail) ?? {}
    ),
    parse: mergeObjectArray(a2 == null ? void 0 : a2.parse, b == null ? void 0 : b.parse),
    transform: mergeObjectArray(a2 == null ? void 0 : a2.transform, b == null ? void 0 : b.transform),
    beforeHandle: mergeObjectArray(
      mergeObjectArray(
        fnToContainer(resolveA, "resolve"),
        a2 == null ? void 0 : a2.beforeHandle
      ),
      mergeObjectArray(
        fnToContainer(resolveB, "resolve"),
        b == null ? void 0 : b.beforeHandle
      )
    ),
    afterHandle: mergeObjectArray(a2 == null ? void 0 : a2.afterHandle, b == null ? void 0 : b.afterHandle),
    mapResponse: mergeObjectArray(a2 == null ? void 0 : a2.mapResponse, b == null ? void 0 : b.mapResponse),
    afterResponse: mergeObjectArray(
      a2 == null ? void 0 : a2.afterResponse,
      b == null ? void 0 : b.afterResponse
    ),
    trace: mergeObjectArray(a2 == null ? void 0 : a2.trace, b == null ? void 0 : b.trace),
    error: mergeObjectArray(a2 == null ? void 0 : a2.error, b == null ? void 0 : b.error)
  };
};
const replaceSchemaType = (schema, options, root = true) => {
  if (!Array.isArray(options))
    return _replaceSchemaType(schema, options, root);
  for (const option of options)
    schema = _replaceSchemaType(schema, option, root);
  return schema;
};
const _replaceSchemaType = (schema, options, root = true) => {
  if (!schema) return schema;
  if (options.untilObjectFound && !root && schema.type === "object")
    return schema;
  const fromSymbol = options.from[Kind$1];
  if (schema.oneOf) {
    for (let i = 0; i < schema.oneOf.length; i++)
      schema.oneOf[i] = _replaceSchemaType(schema.oneOf[i], options, root);
    return schema;
  }
  if (schema.anyOf) {
    for (let i = 0; i < schema.anyOf.length; i++)
      schema.anyOf[i] = _replaceSchemaType(schema.anyOf[i], options, root);
    return schema;
  }
  if (schema.allOf) {
    for (let i = 0; i < schema.allOf.length; i++)
      schema.allOf[i] = _replaceSchemaType(schema.allOf[i], options, root);
    return schema;
  }
  if (schema.not) {
    for (let i = 0; i < schema.not.length; i++)
      schema.not[i] = _replaceSchemaType(schema.not[i], options, root);
    return schema;
  }
  const isRoot = root && !!options.excludeRoot;
  if (schema[Kind$1] === fromSymbol) {
    const { anyOf, oneOf, allOf, not, properties: properties2, items, ...rest } = schema;
    const to = options.to(rest);
    let transform;
    const composeProperties = (v) => {
      if (properties2 && v.type === "object") {
        const newProperties = {};
        for (const [key, value2] of Object.entries(properties2))
          newProperties[key] = _replaceSchemaType(
            value2,
            options,
            false
          );
        return {
          ...rest,
          ...v,
          properties: newProperties
        };
      }
      if (items && v.type === "array")
        return {
          ...rest,
          ...v,
          items: _replaceSchemaType(items, options, false)
        };
      const value = {
        ...rest,
        ...v
      };
      delete value["required"];
      if (properties2 && v.type === "string" && v.format === "ObjectString" && v.default === "{}") {
        transform = t.ObjectString(properties2, rest);
        value.default = JSON.stringify(
          Create(t.Object(properties2))
        );
        value.properties = properties2;
      }
      if (items && v.type === "string" && v.format === "ArrayString" && v.default === "[]") {
        transform = t.ArrayString(items, rest);
        value.default = JSON.stringify(Create(t.Array(items)));
        value.items = items;
      }
      return value;
    };
    if (isRoot) {
      if (properties2) {
        const newProperties = {};
        for (const [key, value] of Object.entries(properties2))
          newProperties[key] = _replaceSchemaType(
            value,
            options,
            false
          );
        return {
          ...rest,
          properties: newProperties
        };
      } else if (items == null ? void 0 : items.map)
        return {
          ...rest,
          items: items.map(
            (v) => _replaceSchemaType(v, options, false)
          )
        };
      return rest;
    }
    if (to.anyOf)
      for (let i = 0; i < to.anyOf.length; i++)
        to.anyOf[i] = composeProperties(to.anyOf[i]);
    else if (to.oneOf)
      for (let i = 0; i < to.oneOf.length; i++)
        to.oneOf[i] = composeProperties(to.oneOf[i]);
    else if (to.allOf)
      for (let i = 0; i < to.allOf.length; i++)
        to.allOf[i] = composeProperties(to.allOf[i]);
    else if (to.not)
      for (let i = 0; i < to.not.length; i++)
        to.not[i] = composeProperties(to.not[i]);
    if (transform) to[TransformKind] = transform[TransformKind];
    if (to.anyOf || to.oneOf || to.allOf || to.not) return to;
    if (properties2) {
      const newProperties = {};
      for (const [key, value] of Object.entries(properties2))
        newProperties[key] = _replaceSchemaType(
          value,
          options,
          false
        );
      return {
        ...rest,
        ...to,
        properties: newProperties
      };
    } else if (items == null ? void 0 : items.map)
      return {
        ...rest,
        ...to,
        items: items.map(
          (v) => _replaceSchemaType(v, options, false)
        )
      };
    return {
      ...rest,
      ...to
    };
  }
  const properties = schema == null ? void 0 : schema.properties;
  if (properties && root && options.rootOnly !== true)
    for (const [key, value] of Object.entries(properties)) {
      switch (value[Kind$1]) {
        case fromSymbol:
          const { anyOf, oneOf, allOf, not, type: type2, ...rest } = value;
          const to = options.to(rest);
          if (to.anyOf)
            for (let i = 0; i < to.anyOf.length; i++)
              to.anyOf[i] = { ...rest, ...to.anyOf[i] };
          else if (to.oneOf)
            for (let i = 0; i < to.oneOf.length; i++)
              to.oneOf[i] = { ...rest, ...to.oneOf[i] };
          else if (to.allOf)
            for (let i = 0; i < to.allOf.length; i++)
              to.allOf[i] = { ...rest, ...to.allOf[i] };
          else if (to.not)
            for (let i = 0; i < to.not.length; i++)
              to.not[i] = { ...rest, ...to.not[i] };
          properties[key] = {
            ...rest,
            ..._replaceSchemaType(rest, options, false)
          };
          break;
        case "Object":
        case "Union":
          properties[key] = _replaceSchemaType(value, options, false);
          break;
        default:
          if (value.items)
            for (let i = 0; i < value.items.length; i++) {
              value.items[i] = _replaceSchemaType(
                value.items[i],
                options,
                false
              );
            }
          else if (value.anyOf || value.oneOf || value.allOf || value.not)
            properties[key] = _replaceSchemaType(
              value,
              options,
              false
            );
          break;
      }
    }
  return schema;
};
const createCleaner = (schema) => (value) => {
  if (typeof value === "object")
    try {
      return Clean(schema, structuredClone(value));
    } catch {
      try {
        return Clean(schema, value);
      } catch {
        return value;
      }
    }
  return value;
};
const getSchemaValidator = (s, {
  models = {},
  dynamic = false,
  modules,
  normalize: normalize2 = false,
  additionalProperties = false,
  coerce = false,
  additionalCoerce = []
} = {
  modules: t.Module({})
}) => {
  var _a2, _b;
  if (!s) return void 0;
  if (typeof s === "string" && !(s in models)) return void 0;
  let schema = typeof s === "string" ? (
    // @ts-expect-error
    modules.Import(s) ?? models[s]
  ) : s;
  if (coerce || additionalCoerce) {
    if (coerce)
      schema = replaceSchemaType(schema, [
        {
          from: t.Ref(""),
          // @ts-expect-error
          to: (options) => modules.Import(options["$ref"])
        },
        {
          from: t.Number(),
          to: (options) => t.Numeric(options),
          untilObjectFound: true
        },
        {
          from: t.Boolean(),
          to: (options) => t.BooleanString(options),
          untilObjectFound: true
        },
        ...Array.isArray(additionalCoerce) ? additionalCoerce : [additionalCoerce]
      ]);
    else {
      schema = replaceSchemaType(schema, [
        {
          from: t.Ref(""),
          // @ts-expect-error
          to: (options) => modules.Import(options["$ref"])
        },
        ...Array.isArray(additionalCoerce) ? additionalCoerce : [additionalCoerce]
      ]);
    }
  }
  if (schema.type === "object" && "additionalProperties" in schema === false)
    schema.additionalProperties = additionalProperties;
  if (dynamic) {
    const validator = {
      schema,
      references: "",
      checkFunc: () => {
      },
      code: "",
      Check: (value) => Check(schema, value),
      Errors: (value) => Errors(schema, value),
      Code: () => "",
      Clean: createCleaner(schema),
      Decode: (value) => Decode(schema, value),
      Encode: (value) => Encode(schema, value)
    };
    if (normalize2 && schema.additionalProperties === false)
      validator.Clean = createCleaner(schema);
    if (schema.config) {
      validator.config = schema.config;
      if ((_a2 = validator == null ? void 0 : validator.schema) == null ? void 0 : _a2.config)
        delete validator.schema.config;
    }
    validator.parse = (v) => {
      try {
        return validator.Decode(v);
      } catch (error2) {
        throw [...validator.Errors(v)].map(mapValueError);
      }
    };
    validator.safeParse = (v) => {
      var _a3;
      try {
        return { success: true, data: validator.Decode(v), error: null };
      } catch (error2) {
        const errors = [...compiled.Errors(v)].map(mapValueError);
        return {
          success: false,
          data: null,
          error: (_a3 = errors[0]) == null ? void 0 : _a3.summary,
          errors
        };
      }
    };
    return validator;
  }
  const compiled = TypeCompiler.Compile(schema, Object.values(models));
  compiled.Clean = createCleaner(schema);
  if (schema.config) {
    compiled.config = schema.config;
    if ((_b = compiled == null ? void 0 : compiled.schema) == null ? void 0 : _b.config)
      delete compiled.schema.config;
  }
  compiled.parse = (v) => {
    try {
      return compiled.Decode(v);
    } catch (error2) {
      throw [...compiled.Errors(v)].map(mapValueError);
    }
  };
  compiled.safeParse = (v) => {
    var _a3;
    try {
      return { success: true, data: compiled.Decode(v), error: null };
    } catch (error2) {
      const errors = [...compiled.Errors(v)].map(mapValueError);
      return {
        success: false,
        data: null,
        error: (_a3 = errors[0]) == null ? void 0 : _a3.summary,
        errors
      };
    }
  };
  return compiled;
};
const getResponseSchemaValidator = (s, {
  models = {},
  modules,
  dynamic = false,
  normalize: normalize2 = false,
  additionalProperties = false
}) => {
  if (!s) return;
  if (typeof s === "string" && !(s in models)) return;
  const maybeSchemaOrRecord = typeof s === "string" ? (
    // @ts-ignore
    modules.Import(s) ?? models[s]
  ) : s;
  const compile = (schema, references) => {
    if (dynamic)
      return {
        schema,
        references: "",
        checkFunc: () => {
        },
        code: "",
        Check: (value) => Check(schema, value),
        Errors: (value) => Errors(schema, value),
        Code: () => "",
        Clean: createCleaner(schema),
        Decode: (value) => Decode(schema, value),
        Encode: (value) => Encode(schema, value)
      };
    const compiledValidator = TypeCompiler.Compile(schema, references);
    if (normalize2 && schema.additionalProperties === false)
      compiledValidator.Clean = createCleaner(schema);
    return compiledValidator;
  };
  if (Kind$1 in maybeSchemaOrRecord) {
    if ("additionalProperties" in maybeSchemaOrRecord === false)
      maybeSchemaOrRecord.additionalProperties = additionalProperties;
    return {
      200: compile(maybeSchemaOrRecord, Object.values(models))
    };
  }
  const record = {};
  Object.keys(maybeSchemaOrRecord).forEach((status) => {
    const maybeNameOrSchema = maybeSchemaOrRecord[+status];
    if (typeof maybeNameOrSchema === "string") {
      if (maybeNameOrSchema in models) {
        const schema = models[maybeNameOrSchema];
        schema.type === "object" && "additionalProperties" in schema === false;
        record[+status] = Kind$1 in schema ? compile(schema, Object.values(models)) : schema;
      }
      return void 0;
    }
    if (maybeNameOrSchema.type === "object" && "additionalProperties" in maybeNameOrSchema === false)
      maybeNameOrSchema.additionalProperties = additionalProperties;
    record[+status] = Kind$1 in maybeNameOrSchema ? compile(maybeNameOrSchema, Object.values(models)) : maybeNameOrSchema;
  });
  return record;
};
const isBun$1 = typeof Bun !== "undefined";
const hasHash = isBun$1 && typeof Bun.hash === "function";
const checksum = (s) => {
  if (hasHash) return Bun.hash(s);
  let h = 9;
  for (let i = 0; i < s.length; ) h = Math.imul(h ^ s.charCodeAt(i++), 9 ** 9);
  return h = h ^ h >>> 9;
};
let _stringToStructureCoercions;
const stringToStructureCoercions = () => {
  if (!_stringToStructureCoercions) {
    _stringToStructureCoercions = [
      {
        from: t.Object({}),
        to: () => t.ObjectString({}),
        excludeRoot: true
      },
      {
        from: t.Array(t.Any()),
        to: () => t.ArrayString(t.Any())
      }
    ];
  }
  return _stringToStructureCoercions;
};
let _coercePrimitiveRoot;
const coercePrimitiveRoot = () => {
  if (!_coercePrimitiveRoot)
    _coercePrimitiveRoot = [
      {
        from: t.Number(),
        to: (options) => t.Numeric(options),
        rootOnly: true
      },
      {
        from: t.Boolean(),
        to: (options) => t.BooleanString(options),
        rootOnly: true
      }
    ];
  return _coercePrimitiveRoot;
};
const getCookieValidator = ({
  validator,
  modules,
  defaultConfig = {},
  config,
  dynamic,
  models
}) => {
  let cookieValidator = getSchemaValidator(validator, {
    modules,
    dynamic,
    models,
    additionalProperties: true,
    coerce: true,
    additionalCoerce: stringToStructureCoercions()
  });
  if (isNotEmpty(defaultConfig)) {
    if (cookieValidator) {
      cookieValidator.config = mergeCookie(
        // @ts-expect-error private
        cookieValidator.config,
        config
      );
    } else {
      cookieValidator = getSchemaValidator(t.Cookie({}), {
        modules,
        dynamic,
        models,
        additionalProperties: true
      });
      cookieValidator.config = defaultConfig;
    }
  }
  return cookieValidator;
};
const injectChecksum = (checksum2, x) => {
  if (!x) return;
  if (!Array.isArray(x)) {
    const fn = x;
    if (checksum2 && !fn.checksum) fn.checksum = checksum2;
    if (fn.scope === "scoped") fn.scope = "local";
    return fn;
  }
  const fns = [...x];
  for (const fn of fns) {
    if (checksum2 && !fn.checksum) fn.checksum = checksum2;
    if (fn.scope === "scoped") fn.scope = "local";
  }
  return fns;
};
const mergeLifeCycle = (a2, b, checksum2) => {
  return {
    // ...a,
    // ...b,
    start: mergeObjectArray(
      a2.start,
      injectChecksum(checksum2, b == null ? void 0 : b.start)
    ),
    request: mergeObjectArray(
      a2.request,
      injectChecksum(checksum2, b == null ? void 0 : b.request)
    ),
    parse: mergeObjectArray(
      a2.parse,
      injectChecksum(checksum2, b == null ? void 0 : b.parse)
    ),
    transform: mergeObjectArray(
      a2.transform,
      injectChecksum(checksum2, b == null ? void 0 : b.transform)
    ),
    beforeHandle: mergeObjectArray(
      mergeObjectArray(
        // @ts-ignore
        fnToContainer(a2.resolve, "resolve"),
        a2.beforeHandle
      ),
      injectChecksum(
        checksum2,
        mergeObjectArray(
          fnToContainer(b == null ? void 0 : b.resolve, "resolve"),
          b == null ? void 0 : b.beforeHandle
        )
      )
    ),
    afterHandle: mergeObjectArray(
      a2.afterHandle,
      injectChecksum(checksum2, b == null ? void 0 : b.afterHandle)
    ),
    mapResponse: mergeObjectArray(
      a2.mapResponse,
      injectChecksum(checksum2, b == null ? void 0 : b.mapResponse)
    ),
    afterResponse: mergeObjectArray(
      a2.afterResponse,
      injectChecksum(checksum2, b == null ? void 0 : b.afterResponse)
    ),
    // Already merged on Elysia._use, also logic is more complicated, can't directly merge
    trace: mergeObjectArray(
      a2.trace,
      injectChecksum(checksum2, b == null ? void 0 : b.trace)
    ),
    error: mergeObjectArray(
      a2.error,
      injectChecksum(checksum2, b == null ? void 0 : b.error)
    ),
    stop: mergeObjectArray(
      a2.stop,
      injectChecksum(checksum2, b == null ? void 0 : b.stop)
    )
  };
};
const asHookType = (fn, inject, { skipIfHasType = false } = {}) => {
  if (!fn) return fn;
  if (!Array.isArray(fn)) {
    if (skipIfHasType) fn.scope ?? (fn.scope = inject);
    else fn.scope = inject;
    return fn;
  }
  for (const x of fn)
    if (skipIfHasType) x.scope ?? (x.scope = inject);
    else x.scope = inject;
  return fn;
};
const filterGlobal = (fn) => {
  if (!fn) return fn;
  if (!Array.isArray(fn))
    switch (fn.scope) {
      case "global":
      case "scoped":
        return { ...fn };
      default:
        return { fn };
    }
  const array = [];
  for (const x of fn)
    switch (x.scope) {
      case "global":
      case "scoped":
        array.push({
          ...x
        });
        break;
    }
  return array;
};
const filterGlobalHook = (hook) => {
  return {
    // rest is validator
    ...hook,
    type: hook == null ? void 0 : hook.type,
    detail: hook == null ? void 0 : hook.detail,
    parse: filterGlobal(hook == null ? void 0 : hook.parse),
    transform: filterGlobal(hook == null ? void 0 : hook.transform),
    beforeHandle: filterGlobal(hook == null ? void 0 : hook.beforeHandle),
    afterHandle: filterGlobal(hook == null ? void 0 : hook.afterHandle),
    mapResponse: filterGlobal(hook == null ? void 0 : hook.mapResponse),
    afterResponse: filterGlobal(hook == null ? void 0 : hook.afterResponse),
    error: filterGlobal(hook == null ? void 0 : hook.error),
    trace: filterGlobal(hook == null ? void 0 : hook.trace)
  };
};
const StatusMap = {
  Continue: 100,
  "Switching Protocols": 101,
  Processing: 102,
  "Early Hints": 103,
  OK: 200,
  Created: 201,
  Accepted: 202,
  "Non-Authoritative Information": 203,
  "No Content": 204,
  "Reset Content": 205,
  "Partial Content": 206,
  "Multi-Status": 207,
  "Already Reported": 208,
  "Multiple Choices": 300,
  "Moved Permanently": 301,
  Found: 302,
  "See Other": 303,
  "Not Modified": 304,
  "Temporary Redirect": 307,
  "Permanent Redirect": 308,
  "Bad Request": 400,
  Unauthorized: 401,
  "Payment Required": 402,
  Forbidden: 403,
  "Not Found": 404,
  "Method Not Allowed": 405,
  "Not Acceptable": 406,
  "Proxy Authentication Required": 407,
  "Request Timeout": 408,
  Conflict: 409,
  Gone: 410,
  "Length Required": 411,
  "Precondition Failed": 412,
  "Payload Too Large": 413,
  "URI Too Long": 414,
  "Unsupported Media Type": 415,
  "Range Not Satisfiable": 416,
  "Expectation Failed": 417,
  "I'm a teapot": 418,
  "Misdirected Request": 421,
  "Unprocessable Content": 422,
  Locked: 423,
  "Failed Dependency": 424,
  "Too Early": 425,
  "Upgrade Required": 426,
  "Precondition Required": 428,
  "Too Many Requests": 429,
  "Request Header Fields Too Large": 431,
  "Unavailable For Legal Reasons": 451,
  "Internal Server Error": 500,
  "Not Implemented": 501,
  "Bad Gateway": 502,
  "Service Unavailable": 503,
  "Gateway Timeout": 504,
  "HTTP Version Not Supported": 505,
  "Variant Also Negotiates": 506,
  "Insufficient Storage": 507,
  "Loop Detected": 508,
  "Not Extended": 510,
  "Network Authentication Required": 511
};
const InvertedStatusMap = Object.fromEntries(
  Object.entries(StatusMap).map(([k, v]) => [v, k])
);
function removeTrailingEquals(digest) {
  let trimmedDigest = digest;
  while (trimmedDigest.endsWith("=")) {
    trimmedDigest = trimmedDigest.slice(0, -1);
  }
  return trimmedDigest;
}
const encoder = new TextEncoder();
const signCookie = async (val, secret) => {
  if (typeof val !== "string")
    throw new TypeError("Cookie value must be provided as a string.");
  if (secret === null) throw new TypeError("Secret key must be provided.");
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const hmacBuffer = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(val)
  );
  return val + "." + removeTrailingEquals(Buffer.from(hmacBuffer).toString("base64"));
};
const unsignCookie = async (input, secret) => {
  if (typeof input !== "string")
    throw new TypeError("Signed cookie string must be provided.");
  if (null === secret) throw new TypeError("Secret key must be provided.");
  const tentativeValue = input.slice(0, input.lastIndexOf("."));
  const expectedInput = await signCookie(tentativeValue, secret);
  return expectedInput === input ? tentativeValue : false;
};
const traceBackMacro = (extension, property, manage) => {
  if (!extension || typeof extension !== "object" || !property) return;
  for (const [key, value] of Object.entries(property)) {
    if (key in primitiveHookMap || !(key in extension)) continue;
    const v = extension[key];
    if (typeof v === "function") {
      const hook = v(value);
      if (typeof hook === "object") {
        for (const [k, v2] of Object.entries(hook)) {
          manage(k)({
            fn: v2
          });
        }
      }
    }
    delete property[key];
  }
};
const createMacroManager = ({
  globalHook,
  localHook
}) => (stackName) => (type2, fn) => {
  if (typeof type2 === "function")
    type2 = {
      fn: type2
    };
  if (stackName === "resolve") {
    type2 = {
      ...type2,
      subType: "resolve"
    };
  }
  if ("fn" in type2 || Array.isArray(type2)) {
    if (!localHook[stackName]) localHook[stackName] = [];
    if (typeof localHook[stackName] === "function")
      localHook[stackName] = [localHook[stackName]];
    if (Array.isArray(type2))
      localHook[stackName] = localHook[stackName].concat(type2);
    else localHook[stackName].push(type2);
    return;
  }
  const { insert = "after", stack = "local" } = type2;
  if (typeof fn === "function") fn = { fn };
  if (stack === "global") {
    if (!Array.isArray(fn)) {
      if (insert === "before") {
        globalHook[stackName].unshift(fn);
      } else {
        globalHook[stackName].push(fn);
      }
    } else {
      if (insert === "before") {
        globalHook[stackName] = fn.concat(
          globalHook[stackName]
        );
      } else {
        globalHook[stackName] = globalHook[stackName].concat(fn);
      }
    }
  } else {
    if (!localHook[stackName]) localHook[stackName] = [];
    if (typeof localHook[stackName] === "function")
      localHook[stackName] = [localHook[stackName]];
    if (!Array.isArray(fn)) {
      if (insert === "before") {
        localHook[stackName].unshift(fn);
      } else {
        localHook[stackName].push(fn);
      }
    } else {
      if (insert === "before") {
        localHook[stackName] = fn.concat(localHook[stackName]);
      } else {
        localHook[stackName] = localHook[stackName].concat(fn);
      }
    }
  }
};
const parseNumericString = (message) => {
  if (typeof message === "number") return message;
  if (message.length < 16) {
    if (message.trim().length === 0) return null;
    const length = Number(message);
    if (Number.isNaN(length)) return null;
    return length;
  }
  if (message.length === 16) {
    if (message.trim().length === 0) return null;
    const number = Number(message);
    if (Number.isNaN(number) || number.toString() !== message) return null;
    return number;
  }
  return null;
};
const isNumericString = (message) => parseNumericString(message) !== null;
class PromiseGroup {
  constructor(onError = console.error) {
    this.onError = onError;
    this.root = null;
    this.promises = [];
  }
  /**
   * The number of promises still being awaited.
   */
  get size() {
    return this.promises.length;
  }
  /**
   * Add a promise to the group.
   * @returns The promise that was added.
   */
  add(promise) {
    this.promises.push(promise);
    this.root || (this.root = this.drain());
    return promise;
  }
  async drain() {
    while (this.promises.length > 0) {
      try {
        await this.promises[0];
      } catch (error2) {
        this.onError(error2);
      }
      this.promises.shift();
    }
    this.root = null;
  }
  // Allow the group to be awaited.
  then(onfulfilled, onrejected) {
    return (this.root ?? Promise.resolve()).then(onfulfilled, onrejected);
  }
}
const fnToContainer = (fn, subType) => {
  if (!fn) return fn;
  if (!Array.isArray(fn)) {
    if (typeof fn === "function" || typeof fn === "string")
      return subType ? { fn, subType } : { fn };
    else if ("fn" in fn) return fn;
  }
  const fns = [];
  for (const x of fn) {
    if (typeof x === "function" || typeof x === "string")
      fns.push(subType ? { fn: x, subType } : { fn: x });
    else if ("fn" in x) fns.push(x);
  }
  return fns;
};
const localHookToLifeCycleStore = (a2) => {
  return {
    ...a2,
    start: fnToContainer(a2 == null ? void 0 : a2.start),
    request: fnToContainer(a2 == null ? void 0 : a2.request),
    parse: fnToContainer(a2 == null ? void 0 : a2.parse),
    transform: fnToContainer(a2 == null ? void 0 : a2.transform),
    beforeHandle: fnToContainer(a2 == null ? void 0 : a2.beforeHandle),
    afterHandle: fnToContainer(a2 == null ? void 0 : a2.afterHandle),
    mapResponse: fnToContainer(a2 == null ? void 0 : a2.mapResponse),
    afterResponse: fnToContainer(a2 == null ? void 0 : a2.afterResponse),
    trace: fnToContainer(a2 == null ? void 0 : a2.trace),
    error: fnToContainer(a2 == null ? void 0 : a2.error),
    stop: fnToContainer(a2 == null ? void 0 : a2.stop)
  };
};
const lifeCycleToFn = (a2) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  return {
    ...a2,
    start: (_a2 = a2.start) == null ? void 0 : _a2.map((x) => x.fn),
    request: (_b = a2.request) == null ? void 0 : _b.map((x) => x.fn),
    parse: (_c = a2.parse) == null ? void 0 : _c.map((x) => x.fn),
    transform: (_d = a2.transform) == null ? void 0 : _d.map((x) => x.fn),
    beforeHandle: (_e = a2.beforeHandle) == null ? void 0 : _e.map((x) => x.fn),
    afterHandle: (_f = a2.afterHandle) == null ? void 0 : _f.map((x) => x.fn),
    afterResponse: (_g = a2.afterResponse) == null ? void 0 : _g.map((x) => x.fn),
    mapResponse: (_h = a2.mapResponse) == null ? void 0 : _h.map((x) => x.fn),
    trace: (_i = a2.trace) == null ? void 0 : _i.map((x) => x.fn),
    error: (_j = a2.error) == null ? void 0 : _j.map((x) => x.fn),
    stop: (_k = a2.stop) == null ? void 0 : _k.map((x) => x.fn)
  };
};
const cloneInference = (inference) => ({
  body: inference.body,
  cookie: inference.cookie,
  headers: inference.headers,
  query: inference.query,
  set: inference.set,
  server: inference.server,
  request: inference.request,
  route: inference.route
});
const redirect = (url, status = 302) => Response.redirect(url, status);
const ELYSIA_REQUEST_ID = Symbol("ElysiaRequestId");
const randomId = () => {
  const uuid = crypto.randomUUID();
  return uuid.slice(0, 8) + uuid.slice(24, 32);
};
const deduplicateChecksum = (array) => {
  const hashes = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item.checksum) {
      if (hashes.includes(item.checksum)) {
        array.splice(i, 1);
        i--;
      }
      hashes.push(item.checksum);
    }
  }
  return array;
};
const promoteEvent = (events, as = "scoped") => {
  if (as === "scoped") {
    for (const event of events)
      if ("scope" in event && event.scope === "local")
        event.scope = "scoped";
    return;
  }
  for (const event of events) if ("scope" in event) event.scope = "global";
};
const getLoosePath = (path) => {
  if (path.charCodeAt(path.length - 1) === 47)
    return path.slice(0, path.length - 1);
  return path + "/";
};
const isNotEmpty = (obj) => {
  if (!obj) return false;
  for (const x in obj) return true;
  return false;
};
const env$1 = typeof Bun !== "undefined" ? Bun.env : typeof process !== "undefined" ? process == null ? void 0 : process.env : void 0;
const ERROR_CODE = Symbol("ElysiaErrorCode");
const isProduction = ((env$1 == null ? void 0 : env$1.NODE_ENV) ?? (env$1 == null ? void 0 : env$1.ENV)) === "production";
class ElysiaCustomStatusResponse {
  constructor(code, response) {
    const res = response ?? (code in InvertedStatusMap ? (
      // @ts-expect-error Always correct
      InvertedStatusMap[code]
    ) : code);
    this.code = StatusMap[code] ?? code;
    this.response = res;
  }
}
const error = (code, response) => new ElysiaCustomStatusResponse(code, response);
class InternalServerError extends Error {
  constructor(message) {
    super(message ?? "INTERNAL_SERVER_ERROR");
    this.code = "INTERNAL_SERVER_ERROR";
    this.status = 500;
  }
}
class NotFoundError extends Error {
  constructor(message) {
    super(message ?? "NOT_FOUND");
    this.code = "NOT_FOUND";
    this.status = 404;
  }
}
class ParseError extends Error {
  constructor() {
    super("Bad Request");
    this.code = "PARSE";
    this.status = 400;
  }
}
class InvalidCookieSignature extends Error {
  constructor(key, message) {
    super(message ?? `"${key}" has invalid cookie signature`);
    this.key = key;
    this.code = "INVALID_COOKIE_SIGNATURE";
    this.status = 400;
  }
}
const mapValueError = (error2) => {
  if (!error2)
    return {
      summary: void 0
    };
  const { message, path, value, type: type2 } = error2;
  const property = path.slice(1).replaceAll("/", ".");
  const isRoot = path === "";
  switch (type2) {
    case 42:
      return {
        ...error2,
        summary: isRoot ? `Value should not be provided` : `Property '${property}' should not be provided`
      };
    case 45:
      return {
        ...error2,
        summary: isRoot ? `Value is missing` : `Property '${property}' is missing`
      };
    case 50:
      const quoteIndex = message.indexOf("'");
      const format = message.slice(
        quoteIndex + 1,
        message.indexOf("'", quoteIndex + 1)
      );
      return {
        ...error2,
        summary: isRoot ? `Value should be an email` : `Property '${property}' should be ${format}`
      };
    case 54:
      return {
        ...error2,
        summary: `${message.slice(
          0,
          9
        )} property '${property}' to be ${message.slice(
          8
        )} but found: ${value}`
      };
    case 62:
      const union = error2.schema.anyOf.map((x) => `'${(x == null ? void 0 : x.format) ?? x.type}'`).join(", ");
      return {
        ...error2,
        summary: isRoot ? `Value should be one of ${union}` : `Property '${property}' should be one of: ${union}`
      };
    default:
      return { summary: message, ...error2 };
  }
};
class ValidationError extends Error {
  constructor(type2, validator, value) {
    if (value && typeof value === "object" && value instanceof ElysiaCustomStatusResponse)
      value = value.response;
    const error2 = isProduction ? void 0 : "Errors" in validator ? validator.Errors(value).First() : Errors(validator, value).First();
    const customError = error2.schema.message || (error2 == null ? void 0 : error2.schema.error) !== void 0 ? typeof error2.schema.error === "function" ? error2.schema.error({
      type: type2,
      validator,
      value,
      get errors() {
        return [...validator.Errors(value)].map(
          mapValueError
        );
      }
    }) : error2.schema.error : void 0;
    const accessor = (error2 == null ? void 0 : error2.path) || "root";
    let message = "";
    if (customError !== void 0) {
      message = typeof customError === "object" ? JSON.stringify(customError) : customError + "";
    } else if (isProduction) {
      message = JSON.stringify({
        type: "validation",
        on: type2,
        summary: mapValueError(error2).summary,
        message: error2 == null ? void 0 : error2.message,
        found: value
      });
    } else {
      const schema = (validator == null ? void 0 : validator.schema) ?? validator;
      const errors = "Errors" in validator ? [...validator.Errors(value)].map(mapValueError) : [...Errors(validator, value)].map(mapValueError);
      let expected;
      try {
        expected = Create(schema);
      } catch (error3) {
        expected = {
          type: "Could not create expected value",
          // @ts-expect-error
          message: error3 == null ? void 0 : error3.message,
          error: error3
        };
      }
      message = JSON.stringify(
        {
          type: "validation",
          on: type2,
          summary: mapValueError(error2).summary,
          property: accessor,
          message: error2 == null ? void 0 : error2.message,
          expected,
          found: value,
          errors
        },
        null,
        2
      );
    }
    super(message);
    this.type = type2;
    this.validator = validator;
    this.value = value;
    this.code = "VALIDATION";
    this.status = 422;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
  get all() {
    return "Errors" in this.validator ? [...this.validator.Errors(this.value)].map(mapValueError) : (
      // @ts-ignore
      [...Errors(this.validator, this.value)].map(mapValueError)
    );
  }
  static simplifyModel(validator) {
    const model = "schema" in validator ? validator.schema : validator;
    try {
      return Create(model);
    } catch {
      return model;
    }
  }
  get model() {
    return ValidationError.simplifyModel(this.validator);
  }
  toResponse(headers) {
    return new Response(this.message, {
      status: 400,
      headers: {
        ...headers,
        "content-type": "application/json"
      }
    });
  }
}
const isISO8601 = /(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/;
const isFormalDate = /(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2}\sGMT(?:\+|-)\d{4}\s\([^)]+\)/;
const isShortenDate = /^(?:(?:(?:(?:0?[1-9]|[12][0-9]|3[01])[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:19|20)\d{2})|(?:(?:19|20)\d{2}[/\s-](?:0?[1-9]|1[0-2])[/\s-](?:0?[1-9]|[12][0-9]|3[01]))))(?:\s(?:1[012]|0?[1-9]):[0-5][0-9](?::[0-5][0-9])?(?:\s[AP]M)?)?$/;
const _validateDate = fullFormats.date;
const _validateDateTime = fullFormats["date-time"];
if (!Has$1("date"))
  TypeSystem.Format("date", (value) => {
    const temp = value.replace(/"/g, "");
    if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDate(temp)) {
      const date2 = new Date(temp);
      if (!Number.isNaN(date2.getTime())) return true;
    }
    return false;
  });
if (!Has$1("date-time"))
  TypeSystem.Format("date-time", (value) => {
    const temp = value.replace(/"/g, "");
    if (isISO8601.test(temp) || isFormalDate.test(temp) || isShortenDate.test(temp) || _validateDateTime(temp)) {
      const date2 = new Date(temp);
      if (!Number.isNaN(date2.getTime())) return true;
    }
    return false;
  });
Object.entries(fullFormats).forEach((formatEntry) => {
  const [formatName, formatValue] = formatEntry;
  if (!Has$1(formatName)) {
    if (formatValue instanceof RegExp)
      TypeSystem.Format(formatName, (value) => formatValue.test(value));
    else if (typeof formatValue === "function")
      TypeSystem.Format(formatName, formatValue);
  }
});
const t = Object.assign({}, Type);
const parseFileUnit = (size) => {
  if (typeof size === "string")
    switch (size.slice(-1)) {
      case "k":
        return +size.slice(0, size.length - 1) * 1024;
      case "m":
        return +size.slice(0, size.length - 1) * 1048576;
      default:
        return +size;
    }
  return size;
};
const validateFile = (options, value) => {
  if (!(value instanceof Blob)) return false;
  if (options.minSize && value.size < parseFileUnit(options.minSize))
    return false;
  if (options.maxSize && value.size > parseFileUnit(options.maxSize))
    return false;
  if (options.extension)
    if (typeof options.extension === "string") {
      if (!value.type.startsWith(options.extension)) return false;
    } else {
      for (let i = 0; i < options.extension.length; i++)
        if (value.type.startsWith(options.extension[i])) return true;
      return false;
    }
  return true;
};
const File = Get("Files") ?? TypeSystem.Type("File", validateFile);
const Files = Get("Files") ?? TypeSystem.Type(
  "Files",
  (options, value) => {
    if (!Array.isArray(value)) return validateFile(options, value);
    if (options.minItems && value.length < options.minItems)
      return false;
    if (options.maxItems && value.length > options.maxItems)
      return false;
    for (let i = 0; i < value.length; i++)
      if (!validateFile(options, value[i])) return false;
    return true;
  }
);
if (!Has$1("numeric"))
  Set$2("numeric", (value) => !!value && !isNaN(+value));
if (!Has$1("integer"))
  Set$2(
    "integer",
    (value) => !!value && Number.isInteger(+value)
  );
if (!Has$1("boolean"))
  Set$2(
    "boolean",
    (value) => value === "true" || value === "false"
  );
if (!Has$1("ObjectString"))
  Set$2("ObjectString", (value) => {
    let start = value.charCodeAt(0);
    if (start === 9 || start === 10 || start === 32)
      start = value.trimStart().charCodeAt(0);
    if (start !== 123 && start !== 91) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  });
if (!Has$1("ArrayString"))
  Set$2("ArrayString", (value) => {
    let start = value.charCodeAt(0);
    if (start === 9 || start === 10 || start === 32)
      start = value.trimStart().charCodeAt(0);
    if (start !== 123 && start !== 91) return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  });
Set$1("UnionEnum", (schema, value) => {
  return (typeof value === "number" || typeof value === "string" || value === null) && schema.enum.includes(value);
});
const ElysiaType = {
  Numeric: (property) => {
    const schema = Type.Number(property);
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "numeric",
            default: 0
          }),
          t.Number(property)
        ],
        property
      )
    ).Decode((value) => {
      const number = +value;
      if (isNaN(number)) return value;
      if (property && !Check(schema, number))
        throw new ValidationError("property", schema, number);
      return number;
    }).Encode((value) => value);
  },
  Integer: (property) => {
    const schema = Type.Integer(property);
    return t.Transform(
      t.Union(
        [
          t.String({
            format: "integer",
            default: 0
          }),
          t.Number(property)
        ],
        property
      )
    ).Decode((value) => {
      const number = +value;
      if (!Check(schema, number))
        throw new ValidationError("property", schema, number);
      return number;
    }).Encode((value) => value);
  },
  Date: (property) => {
    const schema = Type.Date(property);
    return t.Transform(
      t.Union(
        [
          Type.Date(property),
          t.String({
            format: "date",
            default: (/* @__PURE__ */ new Date()).toISOString()
          }),
          t.String({
            format: "date-time",
            default: (/* @__PURE__ */ new Date()).toISOString()
          }),
          t.Number()
        ],
        property
      )
    ).Decode((value) => {
      if (typeof value === "number") {
        const date22 = new Date(value);
        if (!Check(schema, date22))
          throw new ValidationError("property", schema, date22);
        return date22;
      }
      if (value instanceof Date) return value;
      const date2 = new Date(value);
      if (!Check(schema, date2))
        throw new ValidationError("property", schema, date2);
      return date2;
    }).Encode((value) => {
      if (typeof value === "string") return new Date(value);
      return value;
    });
  },
  BooleanString: (property) => {
    const schema = Type.Boolean(property);
    return t.Transform(
      t.Union(
        [
          t.Boolean(property),
          t.String({
            format: "boolean",
            default: false
          })
        ],
        property
      )
    ).Decode((value) => {
      if (typeof value === "string") return value === "true";
      if (value !== void 0 && !Check(schema, value))
        throw new ValidationError("property", schema, value);
      return value;
    }).Encode((value) => value);
  },
  ObjectString: (properties, options) => {
    const schema = t.Object(properties, options);
    const defaultValue = JSON.stringify(Create(schema));
    let compiler;
    try {
      compiler = TypeCompiler.Compile(schema);
    } catch {
    }
    return t.Transform(
      t.Union([
        t.String({
          format: "ObjectString",
          default: defaultValue
        }),
        schema
      ])
    ).Decode((value) => {
      if (typeof value === "string") {
        if (value.charCodeAt(0) !== 123)
          throw new ValidationError("property", schema, value);
        try {
          value = JSON.parse(value);
        } catch {
          throw new ValidationError("property", schema, value);
        }
        if (compiler) {
          if (!compiler.Check(value))
            throw new ValidationError("property", schema, value);
          return compiler.Decode(value);
        }
        if (!Check(schema, value))
          throw new ValidationError("property", schema, value);
        return Decode(schema, value);
      }
      return value;
    }).Encode((value) => {
      if (typeof value === "string")
        try {
          value = JSON.parse(value);
        } catch {
          throw new ValidationError("property", schema, value);
        }
      if (!Check(schema, value))
        throw new ValidationError("property", schema, value);
      return JSON.stringify(value);
    });
  },
  ArrayString: (children = {}, options) => {
    const schema = t.Array(children, options);
    const defaultValue = JSON.stringify(Create(schema));
    let compiler;
    try {
      compiler = TypeCompiler.Compile(schema);
    } catch {
    }
    return t.Transform(
      t.Union([
        t.String({
          format: "ArrayString",
          default: defaultValue
        }),
        schema
      ])
    ).Decode((value) => {
      if (typeof value === "string") {
        if (value.charCodeAt(0) !== 91)
          throw new ValidationError("property", schema, value);
        try {
          value = JSON.parse(value);
        } catch {
          throw new ValidationError("property", schema, value);
        }
        if (compiler) {
          if (!compiler.Check(value))
            throw new ValidationError("property", schema, value);
          return compiler.Decode(value);
        }
        if (!Check(schema, value))
          throw new ValidationError("property", schema, value);
        return Decode(schema, value);
      }
      return value;
    }).Encode((value) => {
      if (typeof value === "string")
        try {
          value = JSON.parse(value);
        } catch {
          throw new ValidationError("property", schema, value);
        }
      if (!Check(schema, value))
        throw new ValidationError("property", schema, value);
      return JSON.stringify(value);
    });
  },
  File,
  Files: (options = {}) => t.Transform(Files(options)).Decode((value) => {
    if (Array.isArray(value)) return value;
    return [value];
  }).Encode((value) => value),
  Nullable: (schema, options) => t.Union([schema, t.Null()], options),
  /**
   * Allow Optional, Nullable and Undefined
   */
  MaybeEmpty: (schema, options) => t.Union([schema, t.Null(), t.Undefined()], options),
  Cookie: (properties, {
    domain,
    expires,
    httpOnly,
    maxAge,
    path,
    priority,
    sameSite,
    secure,
    secrets,
    sign,
    ...options
  } = {}) => {
    const v = t.Object(properties, options);
    v.config = {
      domain,
      expires,
      httpOnly,
      maxAge,
      path,
      priority,
      sameSite,
      secure,
      secrets,
      sign
    };
    return v;
  },
  // based on https://github.com/elysiajs/elysia/issues/512#issuecomment-1980134955
  UnionEnum: (values, options = {}) => {
    const type2 = values.every((value) => typeof value === "string") ? { type: "string" } : values.every((value) => typeof value === "number") ? { type: "number" } : values.every((value) => value === null) ? { type: "null" } : {};
    if (values.some((x) => typeof x === "object" && x !== null))
      throw new Error("This type does not support objects or arrays");
    return {
      // why it need default??
      default: values[0],
      ...options,
      [Kind$1]: "UnionEnum",
      ...type2,
      enum: values
    };
  }
};
t.BooleanString = ElysiaType.BooleanString;
t.ObjectString = ElysiaType.ObjectString;
t.ArrayString = ElysiaType.ArrayString;
t.Numeric = ElysiaType.Numeric;
t.Integer = ElysiaType.Integer;
t.File = (arg = {}) => ElysiaType.File({
  default: "File",
  ...arg,
  extension: arg == null ? void 0 : arg.type,
  type: "string",
  format: "binary"
});
t.Files = (arg = {}) => ElysiaType.Files({
  ...arg,
  elysiaMeta: "Files",
  default: "Files",
  extension: arg == null ? void 0 : arg.type,
  type: "array",
  items: {
    ...arg,
    default: "Files",
    type: "string",
    format: "binary"
  }
});
t.Nullable = (schema) => ElysiaType.Nullable(schema);
t.MaybeEmpty = ElysiaType.MaybeEmpty;
t.Cookie = ElysiaType.Cookie;
t.Date = ElysiaType.Date;
t.UnionEnum = ElysiaType.UnionEnum;
const hasReturn = (fn) => {
  const fnLiteral = typeof fn === "object" ? fn.fn.toString() : typeof fn === "string" ? fn.toString() : fn;
  const parenthesisEnd = fnLiteral.indexOf(")");
  if (fnLiteral.charCodeAt(parenthesisEnd + 2) === 61 && fnLiteral.charCodeAt(parenthesisEnd + 5) !== 123) {
    return true;
  }
  return fnLiteral.includes("return");
};
const separateFunction = (code) => {
  if (code.startsWith("async")) code = code.slice(5);
  code = code.trimStart();
  let index = -1;
  if (code.charCodeAt(0) === 40) {
    index = code.indexOf("=>", code.indexOf(")"));
    if (index !== -1) {
      let bracketEndIndex = index;
      while (bracketEndIndex > 0)
        if (code.charCodeAt(--bracketEndIndex) === 41) break;
      let body = code.slice(index + 2);
      if (body.charCodeAt(0) === 32) body = body.trimStart();
      return [
        code.slice(1, bracketEndIndex),
        body,
        {
          isArrowReturn: body.charCodeAt(0) !== 123
        }
      ];
    }
  }
  if (/^(\w+)=>/g.test(code)) {
    index = code.indexOf("=>");
    if (index !== -1) {
      let body = code.slice(index + 2);
      if (body.charCodeAt(0) === 32) body = body.trimStart();
      return [
        code.slice(0, index),
        body,
        {
          isArrowReturn: body.charCodeAt(0) !== 123
        }
      ];
    }
  }
  if (code.startsWith("function")) {
    index = code.indexOf("(");
    const end = code.indexOf(")");
    return [
      code.slice(index + 1, end),
      code.slice(end + 2),
      {
        isArrowReturn: false
      }
    ];
  }
  const start = code.indexOf("(");
  if (start !== -1) {
    const sep = code.indexOf("\n", 2);
    const parameter = code.slice(0, sep);
    const end = parameter.lastIndexOf(")") + 1;
    const body = code.slice(sep + 1);
    return [
      parameter.slice(start, end),
      "{" + body,
      {
        isArrowReturn: false
      }
    ];
  }
  const x = code.split("\n", 2);
  return [x[0], x[1], { isArrowReturn: false }];
};
const bracketPairRange = (parameter) => {
  const start = parameter.indexOf("{");
  if (start === -1) return [-1, 0];
  let end = start + 1;
  let deep = 1;
  for (; end < parameter.length; end++) {
    const char = parameter.charCodeAt(end);
    if (char === 123) deep++;
    else if (char === 125) deep--;
    if (deep === 0) break;
  }
  if (deep !== 0) return [0, parameter.length];
  return [start, end + 1];
};
const bracketPairRangeReverse = (parameter) => {
  const end = parameter.lastIndexOf("}");
  if (end === -1) return [-1, 0];
  let start = end - 1;
  let deep = 1;
  for (; start >= 0; start--) {
    const char = parameter.charCodeAt(start);
    if (char === 125) deep++;
    else if (char === 123) deep--;
    if (deep === 0) break;
  }
  if (deep !== 0) return [-1, 0];
  return [start, end + 1];
};
const removeColonAlias = (parameter) => {
  while (true) {
    const start = parameter.indexOf(":");
    if (start === -1) break;
    let end = parameter.indexOf(",", start);
    if (end === -1) end = parameter.indexOf("}", start) - 1;
    if (end === -2) end = parameter.length;
    parameter = parameter.slice(0, start) + parameter.slice(end);
  }
  return parameter;
};
const retrieveRootParamters = (parameter) => {
  let hasParenthesis = false;
  if (parameter.charCodeAt(0) === 40) parameter = parameter.slice(1, -1);
  if (parameter.charCodeAt(0) === 123) {
    hasParenthesis = true;
    parameter = parameter.slice(1, -1);
  }
  parameter = parameter.replace(/( |\t|\n)/g, "").trim();
  let parameters = [];
  while (true) {
    let [start, end] = bracketPairRange(parameter);
    if (start === -1) break;
    parameters.push(parameter.slice(0, start - 1));
    if (parameter.charCodeAt(end) === 44) end++;
    parameter = parameter.slice(end);
  }
  parameter = removeColonAlias(parameter);
  if (parameter) parameters = parameters.concat(parameter.split(","));
  const newParameters = [];
  for (const p of parameters) {
    if (p.indexOf(",") === -1) {
      newParameters.push(p);
      continue;
    }
    for (const q of p.split(",")) newParameters.push(q.trim());
  }
  parameters = newParameters;
  return {
    hasParenthesis,
    parameters
  };
};
const findParameterReference = (parameter, inference) => {
  const { parameters, hasParenthesis } = retrieveRootParamters(parameter);
  if (!inference.query && parameters.includes("query")) inference.query = true;
  if (!inference.headers && parameters.includes("headers"))
    inference.headers = true;
  if (!inference.body && parameters.includes("body")) inference.body = true;
  if (!inference.cookie && parameters.includes("cookie"))
    inference.cookie = true;
  if (!inference.set && parameters.includes("set")) inference.set = true;
  if (!inference.server && parameters.includes("server"))
    inference.server = true;
  if (!inference.request && parameters.includes("request"))
    inference.request = true;
  if (!inference.route && parameters.includes("route")) inference.route = true;
  if (hasParenthesis) return `{ ${parameters.join(", ")} }`;
  return parameters.join(", ");
};
const findEndIndex = (type2, content, index) => {
  const newLineIndex = content.indexOf(type2 + "\n", index);
  const newTabIndex = content.indexOf(type2 + "	", index);
  const commaIndex = content.indexOf(type2 + ",", index);
  const semicolonIndex = content.indexOf(type2 + ";", index);
  const emptyIndex = content.indexOf(type2 + " ", index);
  return [newLineIndex, newTabIndex, commaIndex, semicolonIndex, emptyIndex].filter((i) => i > 0).sort((a2, b) => a2 - b)[0] || -1;
};
const findAlias = (type2, body, depth = 0) => {
  if (depth > 5) return [];
  const aliases = [];
  let content = body;
  while (true) {
    let index = findEndIndex(" = " + type2, content);
    if (index === -1) index = findEndIndex("=" + type2, content);
    if (index === -1) {
      let lastIndex = content.indexOf(" = " + type2);
      if (lastIndex === -1) lastIndex = content.indexOf("=" + type2);
      if (lastIndex + 3 + type2.length !== content.length) break;
      index = lastIndex;
    }
    const part = content.slice(0, index);
    const lastPart = part.lastIndexOf(" ");
    let variable = part.slice(lastPart !== -1 ? lastPart + 1 : -1);
    if (variable === "}") {
      const [start, end] = bracketPairRangeReverse(part);
      aliases.push(removeColonAlias(content.slice(start, end)));
      content = content.slice(index + 3 + type2.length);
      continue;
    }
    while (variable.charCodeAt(0) === 44) variable = variable.slice(1);
    while (variable.charCodeAt(0) === 9) variable = variable.slice(1);
    if (!variable.includes("(")) aliases.push(variable);
    content = content.slice(index + 3 + type2.length);
  }
  for (const alias of aliases) {
    if (alias.charCodeAt(0) === 123) continue;
    const deepAlias = findAlias(alias, body);
    if (deepAlias.length > 0) aliases.push(...deepAlias);
  }
  return aliases;
};
const extractMainParameter = (parameter) => {
  if (!parameter) return;
  if (parameter.charCodeAt(0) !== 123) return parameter;
  parameter = parameter.slice(2, -2);
  const hasComma = parameter.includes(",");
  if (!hasComma) {
    if (parameter.includes("..."))
      return parameter.slice(parameter.indexOf("...") + 3);
    return;
  }
  const spreadIndex = parameter.indexOf("...");
  if (spreadIndex === -1) return;
  return parameter.slice(spreadIndex + 3).trimEnd();
};
const inferBodyReference = (code, aliases, inference) => {
  const access = (type2, alias) => code.includes(alias + "." + type2) || code.includes(alias + '["' + type2 + '"]') || code.includes(alias + "['" + type2 + "']");
  for (const alias of aliases) {
    if (!alias) continue;
    if (alias.charCodeAt(0) === 123) {
      const parameters = retrieveRootParamters(alias).parameters;
      if (!inference.query && parameters.includes("query"))
        inference.query = true;
      if (!inference.headers && parameters.includes("headers"))
        inference.headers = true;
      if (!inference.body && parameters.includes("body"))
        inference.body = true;
      if (!inference.cookie && parameters.includes("cookie"))
        inference.cookie = true;
      if (!inference.set && parameters.includes("set"))
        inference.set = true;
      if (!inference.query && parameters.includes("server"))
        inference.server = true;
      if (!inference.request && parameters.includes("request"))
        inference.request = true;
      if (!inference.route && parameters.includes("route"))
        inference.route = true;
      continue;
    }
    if (!inference.query && access("query", alias)) inference.query = true;
    if (code.includes("return " + alias) || code.includes("return " + alias + ".query"))
      inference.query = true;
    if (!inference.headers && access("headers", alias))
      inference.headers = true;
    if (!inference.body && access("body", alias)) inference.body = true;
    if (!inference.cookie && access("cookie", alias))
      inference.cookie = true;
    if (!inference.set && access("set", alias)) inference.set = true;
    if (!inference.server && access("server", alias))
      inference.server = true;
    if (inference.query && inference.headers && inference.body && inference.cookie && inference.set && inference.server && inference.server && inference.route)
      break;
  }
  return aliases;
};
const isContextPassToFunction = (context, body, inference) => {
  try {
    const captureFunction = new RegExp(`(?:\\w)\\((?:.*)?${context}`, "gs");
    captureFunction.test(body);
    const nextChar = body.charCodeAt(captureFunction.lastIndex);
    if (nextChar === 41 || nextChar === 44) {
      inference.query = true;
      inference.headers = true;
      inference.body = true;
      inference.cookie = true;
      inference.set = true;
      inference.server = true;
      inference.route = true;
      inference.request = true;
      return true;
    }
    return false;
  } catch (error2) {
    console.log(
      "[Sucrose] warning: unexpected isContextPassToFunction error, you may continue development as usual but please report the following to maintainers:"
    );
    console.log("--- body ---");
    console.log(body);
    console.log("--- context ---");
    console.log(context);
    return true;
  }
};
const sucrose = (lifeCycle, inference = {
  query: false,
  headers: false,
  body: false,
  cookie: false,
  set: false,
  server: false,
  request: false,
  route: false
}) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h;
  const events = [];
  if (lifeCycle.handler && typeof lifeCycle.handler === "function")
    events.push(lifeCycle.handler);
  if ((_a2 = lifeCycle.request) == null ? void 0 : _a2.length) events.push(...lifeCycle.request);
  if ((_b = lifeCycle.beforeHandle) == null ? void 0 : _b.length) events.push(...lifeCycle.beforeHandle);
  if ((_c = lifeCycle.parse) == null ? void 0 : _c.length) events.push(...lifeCycle.parse);
  if ((_d = lifeCycle.error) == null ? void 0 : _d.length) events.push(...lifeCycle.error);
  if ((_e = lifeCycle.transform) == null ? void 0 : _e.length) events.push(...lifeCycle.transform);
  if ((_f = lifeCycle.afterHandle) == null ? void 0 : _f.length) events.push(...lifeCycle.afterHandle);
  if ((_g = lifeCycle.mapResponse) == null ? void 0 : _g.length) events.push(...lifeCycle.mapResponse);
  if ((_h = lifeCycle.afterResponse) == null ? void 0 : _h.length) events.push(...lifeCycle.afterResponse);
  for (const e of events) {
    if (!e) continue;
    const event = "fn" in e ? e.fn : e;
    if (typeof event !== "function") continue;
    const [parameter, body, { isArrowReturn }] = separateFunction(
      event.toString()
    );
    const rootParameters = findParameterReference(parameter, inference);
    const mainParameter = extractMainParameter(rootParameters);
    if (mainParameter) {
      const aliases = findAlias(mainParameter, body);
      aliases.splice(0, -1, mainParameter);
      if (!isContextPassToFunction(mainParameter, body, inference))
        inferBodyReference(body, aliases, inference);
      if (!inference.query && body.includes("return " + mainParameter + ".query"))
        inference.query = true;
    }
    if (inference.query && inference.headers && inference.body && inference.cookie && inference.set && inference.server && inference.request && inference.route)
      break;
  }
  return inference;
};
var dist = {};
var hasRequiredDist;
function requireDist() {
  if (hasRequiredDist) return dist;
  hasRequiredDist = 1;
  Object.defineProperty(dist, "__esModule", { value: true });
  dist.parse = parse;
  dist.serialize = serialize;
  const cookieNameRegExp = /^[\u0021-\u003A\u003C\u003E-\u007E]+$/;
  const cookieValueRegExp = /^[\u0021-\u003A\u003C-\u007E]*$/;
  const domainValueRegExp = /^([.]?[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)([.][a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i;
  const pathValueRegExp = /^[\u0020-\u003A\u003D-\u007E]*$/;
  const __toString = Object.prototype.toString;
  const NullObject = /* @__PURE__ */ (() => {
    const C = function() {
    };
    C.prototype = /* @__PURE__ */ Object.create(null);
    return C;
  })();
  function parse(str, options) {
    const obj = new NullObject();
    const len = str.length;
    if (len < 2)
      return obj;
    const dec = (options == null ? void 0 : options.decode) || decode2;
    let index = 0;
    do {
      const eqIdx = str.indexOf("=", index);
      if (eqIdx === -1)
        break;
      const colonIdx = str.indexOf(";", index);
      const endIdx = colonIdx === -1 ? len : colonIdx;
      if (eqIdx > endIdx) {
        index = str.lastIndexOf(";", eqIdx - 1) + 1;
        continue;
      }
      const keyStartIdx = startIndex(str, index, eqIdx);
      const keyEndIdx = endIndex(str, eqIdx, keyStartIdx);
      const key = str.slice(keyStartIdx, keyEndIdx);
      if (obj[key] === void 0) {
        let valStartIdx = startIndex(str, eqIdx + 1, endIdx);
        let valEndIdx = endIndex(str, endIdx, valStartIdx);
        const value = dec(str.slice(valStartIdx, valEndIdx));
        obj[key] = value;
      }
      index = endIdx + 1;
    } while (index < len);
    return obj;
  }
  function startIndex(str, index, max) {
    do {
      const code = str.charCodeAt(index);
      if (code !== 32 && code !== 9)
        return index;
    } while (++index < max);
    return max;
  }
  function endIndex(str, index, min) {
    while (index > min) {
      const code = str.charCodeAt(--index);
      if (code !== 32 && code !== 9)
        return index + 1;
    }
    return min;
  }
  function serialize(name, val, options) {
    const enc = (options == null ? void 0 : options.encode) || encodeURIComponent;
    if (!cookieNameRegExp.test(name)) {
      throw new TypeError(`argument name is invalid: ${name}`);
    }
    const value = enc(val);
    if (!cookieValueRegExp.test(value)) {
      throw new TypeError(`argument val is invalid: ${val}`);
    }
    let str = name + "=" + value;
    if (!options)
      return str;
    if (options.maxAge !== void 0) {
      if (!Number.isInteger(options.maxAge)) {
        throw new TypeError(`option maxAge is invalid: ${options.maxAge}`);
      }
      str += "; Max-Age=" + options.maxAge;
    }
    if (options.domain) {
      if (!domainValueRegExp.test(options.domain)) {
        throw new TypeError(`option domain is invalid: ${options.domain}`);
      }
      str += "; Domain=" + options.domain;
    }
    if (options.path) {
      if (!pathValueRegExp.test(options.path)) {
        throw new TypeError(`option path is invalid: ${options.path}`);
      }
      str += "; Path=" + options.path;
    }
    if (options.expires) {
      if (!isDate(options.expires) || !Number.isFinite(options.expires.valueOf())) {
        throw new TypeError(`option expires is invalid: ${options.expires}`);
      }
      str += "; Expires=" + options.expires.toUTCString();
    }
    if (options.httpOnly) {
      str += "; HttpOnly";
    }
    if (options.secure) {
      str += "; Secure";
    }
    if (options.partitioned) {
      str += "; Partitioned";
    }
    if (options.priority) {
      const priority = typeof options.priority === "string" ? options.priority.toLowerCase() : void 0;
      switch (priority) {
        case "low":
          str += "; Priority=Low";
          break;
        case "medium":
          str += "; Priority=Medium";
          break;
        case "high":
          str += "; Priority=High";
          break;
        default:
          throw new TypeError(`option priority is invalid: ${options.priority}`);
      }
    }
    if (options.sameSite) {
      const sameSite = typeof options.sameSite === "string" ? options.sameSite.toLowerCase() : options.sameSite;
      switch (sameSite) {
        case true:
        case "strict":
          str += "; SameSite=Strict";
          break;
        case "lax":
          str += "; SameSite=Lax";
          break;
        case "none":
          str += "; SameSite=None";
          break;
        default:
          throw new TypeError(`option sameSite is invalid: ${options.sameSite}`);
      }
    }
    return str;
  }
  function decode2(str) {
    if (str.indexOf("%") === -1)
      return str;
    try {
      return decodeURIComponent(str);
    } catch (e) {
      return str;
    }
  }
  function isDate(val) {
    return __toString.call(val) === "[object Date]";
  }
  return dist;
}
var distExports = requireDist();
const hex = [];
for (let i = 48; i < 58; i++) hex[i] = i - 48;
for (let i = 0; i < 6; i++)
  hex[i + 65] = hex[i + 97] = i + 10;
const calcHex = (a2, b) => {
  if (a2 in hex && b in hex) return hex[a2] << 4 | hex[b];
  return 255;
};
const type = [
  ...new Array(128).fill(0),
  ...new Array(16).fill(1),
  ...new Array(16).fill(2),
  ...new Array(32).fill(3),
  4,
  4,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  5,
  6,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  7,
  8,
  7,
  7,
  10,
  9,
  9,
  9,
  11,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4,
  4
];
const next = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  12,
  0,
  0,
  0,
  0,
  24,
  36,
  48,
  60,
  72,
  84,
  96,
  0,
  12,
  12,
  12,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  24,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  24,
  24,
  24,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  24,
  24,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  48,
  48,
  48,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  48,
  48,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  48,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
];
const mask = type.map(
  (val) => [
    127,
    63,
    63,
    63,
    0,
    31,
    15,
    15,
    15,
    7,
    7,
    7
  ][val]
);
const decode = (url) => {
  let percentPosition = url.indexOf("%");
  if (percentPosition === -1) return url;
  let end = url.length - 3;
  if (percentPosition > end) return null;
  let decoded = "", start = 0, codepoint = 0, startOfOctets = percentPosition, state = 12, byte2;
  for (; ; ) {
    byte2 = calcHex(
      url.charCodeAt(percentPosition + 1),
      url.charCodeAt(percentPosition + 2)
    );
    state = next[state + type[byte2]];
    if (state === 0) return null;
    if (state === 12) {
      decoded += url.substring(start, startOfOctets);
      codepoint = codepoint << 6 | byte2 & mask[byte2];
      if (codepoint > 65535)
        decoded += String.fromCharCode(
          55232 + (codepoint >> 10),
          56320 + (codepoint & 1023)
        );
      else decoded += String.fromCharCode(codepoint);
      start = percentPosition + 3;
      percentPosition = url.indexOf("%", start);
      if (percentPosition === -1) return decoded + url.substring(start);
      if (percentPosition > end) return null;
      startOfOctets = percentPosition;
      codepoint = 0;
    } else {
      percentPosition += 3;
      if (percentPosition > end || url.charCodeAt(percentPosition) !== 37)
        return null;
      codepoint = codepoint << 6 | byte2 & mask[byte2];
    }
  }
};
class Cookie {
  constructor(name, jar, initial = {}) {
    this.name = name;
    this.jar = jar;
    this.initial = initial;
  }
  get cookie() {
    return this.jar[this.name] ?? this.initial;
  }
  set cookie(jar) {
    if (!(this.name in this.jar)) this.jar[this.name] = this.initial;
    this.jar[this.name] = jar;
  }
  get setCookie() {
    if (!(this.name in this.jar)) this.jar[this.name] = this.initial;
    return this.jar[this.name];
  }
  set setCookie(jar) {
    this.cookie = jar;
  }
  get value() {
    return this.cookie.value;
  }
  set value(value) {
    this.setCookie.value = value;
  }
  get expires() {
    return this.cookie.expires;
  }
  set expires(expires) {
    this.setCookie.expires = expires;
  }
  get maxAge() {
    return this.cookie.maxAge;
  }
  set maxAge(maxAge) {
    this.setCookie.maxAge = maxAge;
  }
  get domain() {
    return this.cookie.domain;
  }
  set domain(domain) {
    this.setCookie.domain = domain;
  }
  get path() {
    return this.cookie.path;
  }
  set path(path) {
    this.setCookie.path = path;
  }
  get secure() {
    return this.cookie.secure;
  }
  set secure(secure) {
    this.setCookie.secure = secure;
  }
  get httpOnly() {
    return this.cookie.httpOnly;
  }
  set httpOnly(httpOnly) {
    this.setCookie.httpOnly = httpOnly;
  }
  get sameSite() {
    return this.cookie.sameSite;
  }
  set sameSite(sameSite) {
    this.setCookie.sameSite = sameSite;
  }
  get priority() {
    return this.cookie.priority;
  }
  set priority(priority) {
    this.setCookie.priority = priority;
  }
  get partitioned() {
    return this.cookie.partitioned;
  }
  set partitioned(partitioned) {
    this.setCookie.partitioned = partitioned;
  }
  get secrets() {
    return this.cookie.secrets;
  }
  set secrets(secrets) {
    this.setCookie.secrets = secrets;
  }
  update(config) {
    this.setCookie = Object.assign(
      this.cookie,
      typeof config === "function" ? config(this.cookie) : config
    );
    return this;
  }
  set(config) {
    this.setCookie = Object.assign(
      {
        ...this.initial,
        value: this.value
      },
      typeof config === "function" ? config(this.cookie) : config
    );
    return this;
  }
  remove() {
    if (this.value === void 0) return;
    this.set({
      expires: /* @__PURE__ */ new Date(0),
      maxAge: 0,
      value: ""
    });
    return this;
  }
  toString() {
    var _a2;
    return typeof this.value === "object" ? JSON.stringify(this.value) : ((_a2 = this.value) == null ? void 0 : _a2.toString()) ?? "";
  }
}
const createCookieJar = (set2, store, initial) => {
  if (!set2.cookie) set2.cookie = {};
  return new Proxy(store, {
    get(_, key) {
      if (key in store)
        return new Cookie(
          key,
          set2.cookie,
          Object.assign({}, initial ?? {}, store[key])
        );
      return new Cookie(
        key,
        set2.cookie,
        Object.assign({}, initial)
      );
    }
  });
};
const parseCookie = async (set2, cookieString, {
  secrets,
  sign,
  ...initial
} = {}) => {
  if (!cookieString) return createCookieJar(set2, {}, initial);
  const isStringKey = typeof secrets === "string";
  if (sign && sign !== true && !Array.isArray(sign)) sign = [sign];
  const jar = {};
  const cookies = distExports.parse(cookieString);
  for (const [name, v] of Object.entries(cookies)) {
    if (v === void 0) continue;
    let value = decode(v);
    if (sign === true || (sign == null ? void 0 : sign.includes(name))) {
      if (!secrets)
        throw new Error("No secret is provided to cookie plugin");
      if (isStringKey) {
        const temp = await unsignCookie(value, secrets);
        if (temp === false) throw new InvalidCookieSignature(name);
        value = temp;
      } else {
        let decoded = true;
        for (let i = 0; i < secrets.length; i++) {
          const temp = await unsignCookie(value, secrets[i]);
          if (temp !== false) {
            decoded = true;
            value = temp;
            break;
          }
        }
        if (!decoded) throw new InvalidCookieSignature(name);
      }
    }
    jar[name] = {
      value
    };
  }
  return createCookieJar(set2, jar, initial);
};
const serializeCookie = (cookies) => {
  if (!cookies || !isNotEmpty(cookies)) return void 0;
  const set2 = [];
  for (const [key, property] of Object.entries(cookies)) {
    if (!key || !property) continue;
    const value = property.value;
    if (value === void 0 || value === null) continue;
    set2.push(
      distExports.serialize(
        key,
        typeof value === "object" ? JSON.stringify(value) : value + "",
        property
      )
    );
  }
  if (set2.length === 0) return void 0;
  if (set2.length === 1) return set2[0];
  return set2;
};
const handleFile = (response, set2) => {
  const size = response.size;
  if (!set2 && size || size && set2 && set2.status !== 206 && set2.status !== 304 && set2.status !== 412 && set2.status !== 416) {
    if (set2) {
      if (set2.headers instanceof Headers) {
        let setHeaders = {
          "accept-ranges": "bytes",
          "content-range": `bytes 0-${size - 1}/${size}`,
          "transfer-encoding": "chunked"
        };
        if (hasHeaderShorthand)
          setHeaders = set2.headers.toJSON();
        else {
          setHeaders = {};
          for (const [key, value] of set2.headers.entries())
            if (key in set2.headers) setHeaders[key] = value;
        }
        return new Response(response, {
          status: set2.status,
          headers: setHeaders
        });
      }
      if (isNotEmpty(set2.headers))
        return new Response(response, {
          status: set2.status,
          headers: Object.assign(
            {
              "accept-ranges": "bytes",
              "content-range": `bytes 0-${size - 1}/${size}`,
              "transfer-encoding": "chunked"
            },
            set2.headers
          )
        });
    }
    return new Response(response, {
      headers: {
        "accept-ranges": "bytes",
        "content-range": `bytes 0-${size - 1}/${size}`,
        "transfer-encoding": "chunked"
      }
    });
  }
  return new Response(response);
};
const parseSetCookies = (headers, setCookie) => {
  if (!headers) return headers;
  headers.delete("set-cookie");
  for (let i = 0; i < setCookie.length; i++) {
    const index = setCookie[i].indexOf("=");
    headers.append(
      "set-cookie",
      `${setCookie[i].slice(0, index)}=${setCookie[i].slice(index + 1) || ""}`
    );
  }
  return headers;
};
const handleStream = async (generator, set2, request) => {
  let init = generator.next();
  if (init instanceof Promise) init = await init;
  if (init.done) {
    if (set2) return mapResponse(init.value, set2, request);
    return mapCompactResponse(init.value, request);
  }
  return new Response(
    new ReadableStream({
      async start(controller) {
        var _a2;
        let end = false;
        (_a2 = request == null ? void 0 : request.signal) == null ? void 0 : _a2.addEventListener("abort", () => {
          end = true;
          try {
            controller.close();
          } catch {
          }
        });
        if (init.value !== void 0 && init.value !== null) {
          if (typeof init.value === "object")
            try {
              controller.enqueue(
                // @ts-expect-error this is a valid operation
                Buffer.from(JSON.stringify(init.value))
              );
            } catch {
              controller.enqueue(
                // @ts-expect-error this is a valid operation
                Buffer.from(init.value.toString())
              );
            }
          else
            controller.enqueue(
              // @ts-expect-error this is a valid operation
              Buffer.from(init.value.toString())
            );
        }
        for await (const chunk of generator) {
          if (end) break;
          if (chunk === void 0 || chunk === null) continue;
          if (typeof chunk === "object")
            try {
              controller.enqueue(
                // @ts-expect-error this is a valid operation
                Buffer.from(JSON.stringify(chunk))
              );
            } catch {
              controller.enqueue(
                // @ts-expect-error this is a valid operation
                Buffer.from(chunk.toString())
              );
            }
          else
            controller.enqueue(
              // @ts-expect-error this is a valid operation
              Buffer.from(chunk.toString())
            );
          await new Promise(
            (resolve) => setTimeout(() => resolve(), 0)
          );
        }
        try {
          controller.close();
        } catch {
        }
      }
    }),
    {
      ...set2,
      headers: {
        // Manually set transfer-encoding for direct response, eg. app.handle, eden
        "transfer-encoding": "chunked",
        "content-type": "text/event-stream; charset=utf-8",
        ...set2 == null ? void 0 : set2.headers
      }
    }
  );
};
async function* streamResponse(response) {
  const body = response.body;
  if (!body) return;
  const reader = body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield decoder.decode(value);
    }
  } finally {
    reader.releaseLock();
  }
}
const handleSet = (set2) => {
  if (typeof set2.status === "string") set2.status = StatusMap[set2.status];
  if (set2.cookie && isNotEmpty(set2.cookie)) {
    const cookie = serializeCookie(set2.cookie);
    if (cookie) set2.headers["set-cookie"] = cookie;
  }
  if (set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"])) {
    set2.headers = parseSetCookies(
      new Headers(set2.headers),
      set2.headers["set-cookie"]
    );
  }
};
const mergeResponseWithSetHeaders = (response, set2) => {
  var _a2;
  if (response.status !== set2.status && set2.status !== 200 && (response.status <= 300 || response.status > 400))
    response = new Response(response.body, {
      headers: response.headers,
      status: set2.status
    });
  let isCookieSet = false;
  if (set2.headers instanceof Headers)
    for (const key of set2.headers.keys()) {
      if (key === "set-cookie") {
        if (isCookieSet) continue;
        isCookieSet = true;
        for (const cookie of set2.headers.getSetCookie())
          response.headers.append("set-cookie", cookie);
      } else response.headers.append(key, ((_a2 = set2.headers) == null ? void 0 : _a2.get(key)) ?? "");
    }
  else
    for (const key in set2.headers)
      response.headers.append(key, set2.headers[key]);
  return response;
};
const mapResponse = (response, set2, request) => {
  var _a2, _b, _c;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) {
    handleSet(set2);
    switch ((_a2 = response == null ? void 0 : response.constructor) == null ? void 0 : _a2.name) {
      case "String":
        return new Response(response, set2);
      case "Array":
      case "Object":
        return Response.json(response, set2);
      case "ElysiaFile":
        return handleFile(response.value);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        if (!((_b = set2.headers["content-type"]) == null ? void 0 : _b.startsWith(
          "text/event-stream"
        )))
          set2.headers["content-type"] = "text/event-stream; charset=utf-8";
        (_c = request == null ? void 0 : request.signal) == null ? void 0 : _c.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a3;
              if ((request == null ? void 0 : request.signal) && !((_a3 = request == null ? void 0 : request.signal) == null ? void 0 : _a3.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new Response(response, set2);
      case void 0:
        if (!response) return new Response("", set2);
        return Response.json(response, set2);
      case "Response":
        response = mergeResponseWithSetHeaders(
          response,
          set2
        );
        if (response.headers.get("transfer-encoding") === "chunked")
          return handleStream(
            streamResponse(response),
            set2,
            request
          );
        return response;
      case "Error":
        return errorToResponse(response, set2);
      case "Promise":
        return response.then(
          (x) => mapResponse(x, set2, request)
        );
      case "Function":
        return mapResponse(response(), set2, request);
      case "Number":
      case "Boolean":
        return new Response(
          response.toString(),
          set2
        );
      case "Cookie":
        if (response instanceof Cookie)
          return new Response(response.value, set2);
        return new Response(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new Response(response, set2);
      default:
        if (response instanceof Response) {
          response = mergeResponseWithSetHeaders(
            response,
            set2
          );
          if (response.headers.get(
            "transfer-encoding"
          ) === "chunked")
            return handleStream(
              streamResponse(response),
              set2,
              request
            );
          return response;
        }
        if (response instanceof Promise)
          return response.then((x) => mapResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new Response(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new Response(response, set2);
    }
  }
  if (
    // @ts-expect-error
    typeof (response == null ? void 0 : response.next) === "function" || response instanceof ReadableStream || response instanceof Response && response.headers.get("transfer-encoding") === "chunked"
  )
    return handleStream(response, set2, request);
  return mapCompactResponse(response, request);
};
const mapEarlyResponse = (response, set2, request) => {
  var _a2, _b, _c, _d, _e;
  if (response === void 0 || response === null) return;
  if (isNotEmpty(set2.headers) || set2.status !== 200 || set2.cookie) {
    handleSet(set2);
    switch ((_a2 = response == null ? void 0 : response.constructor) == null ? void 0 : _a2.name) {
      case "String":
        return new Response(response, set2);
      case "Array":
      case "Object":
        return Response.json(response, set2);
      case "ElysiaFile":
        return handleFile(response.value);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapEarlyResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        if (!((_b = set2.headers["content-type"]) == null ? void 0 : _b.startsWith(
          "text/event-stream"
        )))
          set2.headers["content-type"] = "text/event-stream; charset=utf-8";
        (_c = request == null ? void 0 : request.signal) == null ? void 0 : _c.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a3;
              if ((request == null ? void 0 : request.signal) && !((_a3 = request == null ? void 0 : request.signal) == null ? void 0 : _a3.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new Response(response, set2);
      case void 0:
        if (!response) return;
        return Response.json(response, set2);
      case "Response":
        response = mergeResponseWithSetHeaders(
          response,
          set2
        );
        if (response.headers.get("transfer-encoding") === "chunked")
          return handleStream(
            streamResponse(response),
            set2,
            request
          );
        return response;
      case "Promise":
        return response.then(
          (x) => mapEarlyResponse(x, set2)
        );
      case "Error":
        return errorToResponse(response, set2);
      case "Function":
        return mapEarlyResponse(response(), set2);
      case "Number":
      case "Boolean":
        return new Response(
          response.toString(),
          set2
        );
      case "FormData":
        return new Response(response);
      case "Cookie":
        if (response instanceof Cookie)
          return new Response(response.value, set2);
        return new Response(response == null ? void 0 : response.toString(), set2);
      default:
        if (response instanceof Response) {
          response = mergeResponseWithSetHeaders(
            response,
            set2
          );
          if (response.headers.get(
            "transfer-encoding"
          ) === "chunked")
            return handleStream(
              streamResponse(response),
              set2,
              request
            );
          return response;
        }
        if (response instanceof Promise)
          return response.then((x) => mapEarlyResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapEarlyResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapEarlyResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapEarlyResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new Response(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new Response(response, set2);
    }
  } else
    switch ((_d = response == null ? void 0 : response.constructor) == null ? void 0 : _d.name) {
      case "String":
        return new Response(response);
      case "Array":
      case "Object":
        return Response.json(response, set2);
      case "ElysiaFile":
        return handleFile(response.value);
      case "Blob":
        return handleFile(response, set2);
      case "ElysiaCustomStatusResponse":
        set2.status = response.code;
        return mapEarlyResponse(
          response.response,
          set2,
          request
        );
      case "ReadableStream":
        (_e = request == null ? void 0 : request.signal) == null ? void 0 : _e.addEventListener(
          "abort",
          {
            handleEvent() {
              var _a3;
              if ((request == null ? void 0 : request.signal) && !((_a3 = request == null ? void 0 : request.signal) == null ? void 0 : _a3.aborted))
                response.cancel();
            }
          },
          {
            once: true
          }
        );
        return new Response(response, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8"
          }
        });
      case void 0:
        if (!response) return new Response("");
        return new Response(JSON.stringify(response), {
          headers: {
            "content-type": "application/json"
          }
        });
      case "Response":
        if (response.headers.get("transfer-encoding") === "chunked")
          return handleStream(
            streamResponse(response)
          );
        return response;
      case "Promise":
        return response.then((x) => {
          const r = mapEarlyResponse(x, set2);
          if (r !== void 0) return r;
        });
      case "Error":
        return errorToResponse(response, set2);
      case "Function":
        return mapCompactResponse(response(), request);
      case "Number":
      case "Boolean":
        return new Response(response.toString());
      case "Cookie":
        if (response instanceof Cookie)
          return new Response(response.value, set2);
        return new Response(response == null ? void 0 : response.toString(), set2);
      case "FormData":
        return new Response(response);
      default:
        if (response instanceof Response) return response;
        if (response instanceof Promise)
          return response.then((x) => mapEarlyResponse(x, set2));
        if (response instanceof Error)
          return errorToResponse(response, set2);
        if (response instanceof ElysiaCustomStatusResponse) {
          set2.status = response.code;
          return mapEarlyResponse(
            response.response,
            set2,
            request
          );
        }
        if (typeof (response == null ? void 0 : response.next) === "function")
          return handleStream(response, set2, request);
        if (typeof (response == null ? void 0 : response.then) === "function")
          return response.then((x) => mapEarlyResponse(x, set2));
        if (typeof (response == null ? void 0 : response.toResponse) === "function")
          return mapEarlyResponse(response.toResponse(), set2);
        if ("charCodeAt" in response) {
          const code = response.charCodeAt(0);
          if (code === 123 || code === 91) {
            if (!set2.headers["Content-Type"])
              set2.headers["Content-Type"] = "application/json";
            return new Response(
              JSON.stringify(response),
              set2
            );
          }
        }
        return new Response(response);
    }
};
const mapCompactResponse = (response, request) => {
  var _a2, _b;
  switch ((_a2 = response == null ? void 0 : response.constructor) == null ? void 0 : _a2.name) {
    case "String":
      return new Response(response);
    case "Object":
    case "Array":
      return Response.json(response);
    case "ElysiaFile":
      return handleFile(response.value);
    case "Blob":
      return handleFile(response);
    case "ElysiaCustomStatusResponse":
      return mapResponse(
        response.response,
        {
          status: response.code,
          headers: {}
        }
      );
    case "ReadableStream":
      (_b = request == null ? void 0 : request.signal) == null ? void 0 : _b.addEventListener(
        "abort",
        {
          handleEvent() {
            var _a3;
            if ((request == null ? void 0 : request.signal) && !((_a3 = request == null ? void 0 : request.signal) == null ? void 0 : _a3.aborted))
              response.cancel();
          }
        },
        {
          once: true
        }
      );
      return new Response(response, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8"
        }
      });
    case void 0:
      if (!response) return new Response("");
      return new Response(JSON.stringify(response), {
        headers: {
          "content-type": "application/json"
        }
      });
    case "Response":
      if (response.headers.get("transfer-encoding") === "chunked")
        return handleStream(streamResponse(response));
      return response;
    case "Error":
      return errorToResponse(response);
    case "Promise":
      return response.then(
        (x) => mapCompactResponse(x, request)
      );
    // ? Maybe response or Blob
    case "Function":
      return mapCompactResponse(response(), request);
    case "Number":
    case "Boolean":
      return new Response(response.toString());
    case "FormData":
      return new Response(response);
    default:
      if (response instanceof Response) return response;
      if (response instanceof Promise)
        return response.then(
          (x) => mapCompactResponse(x, request)
        );
      if (response instanceof Error)
        return errorToResponse(response);
      if (response instanceof ElysiaCustomStatusResponse)
        return mapResponse(
          response.response,
          {
            status: response.code,
            headers: {}
          }
        );
      if (typeof (response == null ? void 0 : response.next) === "function")
        return handleStream(response, void 0, request);
      if (typeof (response == null ? void 0 : response.then) === "function")
        return response.then((x) => mapResponse(x, set));
      if (typeof (response == null ? void 0 : response.toResponse) === "function")
        return mapCompactResponse(response.toResponse());
      if ("charCodeAt" in response) {
        const code = response.charCodeAt(0);
        if (code === 123 || code === 91) {
          return new Response(JSON.stringify(response), {
            headers: {
              "Content-Type": "application/json"
            }
          });
        }
      }
      return new Response(response);
  }
};
const errorToResponse = (error2, set2) => new Response(
  JSON.stringify({
    name: error2 == null ? void 0 : error2.name,
    message: error2 == null ? void 0 : error2.message,
    cause: error2 == null ? void 0 : error2.cause
  }),
  {
    status: (set2 == null ? void 0 : set2.status) !== 200 ? (set2 == null ? void 0 : set2.status) ?? 500 : 500,
    headers: set2 == null ? void 0 : set2.headers
  }
);
const createStaticHandler = (handle, hooks, setHeaders = {}) => {
  if (typeof handle === "function") return;
  const response = mapResponse(handle, {
    headers: setHeaders
  });
  if (hooks.parse.length === 0 && hooks.transform.length === 0 && hooks.beforeHandle.length === 0 && hooks.afterHandle.length === 0)
    return response.clone.bind(response);
};
const WebStandardAdapter = {
  name: "web-standard",
  isWebStandard: true,
  handler: {
    mapResponse,
    mapEarlyResponse,
    mapCompactResponse,
    createStaticHandler
  },
  composeHandler: {
    mapResponseContext: "c.request",
    preferWebstandardHeaders: true,
    // @ts-ignore Bun specific
    headers: "c.headers = {}\nfor (const [key, value] of c.request.headers.entries())c.headers[key] = value\n",
    parser: {
      json(isOptional2) {
        if (isOptional2)
          return `try{c.body=await c.request.json()}catch{}
`;
        return `c.body=await c.request.json()
`;
      },
      text() {
        return `c.body=await c.request.text()
`;
      },
      urlencoded() {
        return `c.body=parseQuery(await c.request.text())
`;
      },
      arrayBuffer() {
        return `c.body=await c.request.arrayBuffer()
`;
      },
      formData(isOptional2) {
        let fnLiteral = "\nc.body={}\n";
        if (isOptional2)
          fnLiteral += `let form;try{form=await c.request.formData()}catch{}`;
        else fnLiteral += `const form=await c.request.formData()
`;
        return fnLiteral + `for(const key of form.keys()){if(c.body[key]) continue
const value=form.getAll(key)
if(value.length===1)c.body[key]=value[0]
else c.body[key]=value}`;
      }
    }
  },
  composeGeneralHandler: {
    parameters: "r",
    createContext(app) {
      var _a2;
      let decoratorsLiteral = "";
      let fnLiteral = "";
      const defaultHeaders = app.setHeaders;
      for (const key of Object.keys(app.singleton.decorator))
        decoratorsLiteral += `,${key}: decorator['${key}']`;
      const standardHostname = ((_a2 = app.config.handler) == null ? void 0 : _a2.standardHostname) ?? true;
      const hasTrace = app.event.trace.length > 0;
      fnLiteral += `const u=r.url,s=u.indexOf('/',${standardHostname ? 11 : 7}),qi=u.indexOf('?', s + 1)
let p
if(qi===-1)p=u.substring(s)
else p=u.substring(s, qi)
`;
      if (hasTrace) fnLiteral += `const id=randomId()
`;
      fnLiteral += `const c={request:r,store,qi,path:p,url:u,redirect,error,set:{headers:`;
      fnLiteral += Object.keys(defaultHeaders ?? {}).length ? "Object.assign({}, app.setHeaders)" : "{}";
      fnLiteral += `,status:200}`;
      if (app.inference.server)
        fnLiteral += `,get server(){return getServer()}`;
      if (hasTrace) fnLiteral += ",[ELYSIA_REQUEST_ID]:id";
      fnLiteral += decoratorsLiteral;
      fnLiteral += `}
`;
      return fnLiteral;
    },
    websocket(app) {
      let fnLiteral = "";
      const wsPaths = app.router.static.ws;
      const wsRouter = app.router.ws;
      if (Object.keys(wsPaths).length || wsRouter.history.length) {
        fnLiteral += `if(r.method==='GET'){switch(p){`;
        for (const [path, index] of Object.entries(wsPaths)) {
          fnLiteral += `case'${path}':` + (app.config.strictPath !== true ? `case'${getLoosePath(path)}':` : "") + `if(r.headers.get('upgrade')==='websocket')return ht[${index}].composed(c)
`;
        }
        fnLiteral += `default:if(r.headers.get('upgrade')==='websocket'){const route=wsRouter.find('ws',p)
if(route){c.params=route.params
if(route.store.handler)return route.store.handler(c)
return (route.store.handler=route.store.compile())(c)}}break}}`;
      }
      return fnLiteral;
    },
    error404(hasEventHook, hasErrorHook) {
      let findDynamicRoute = `if(route===null)return `;
      if (hasErrorHook)
        findDynamicRoute += `app.handleError(c,notFound,false,${this.parameters})`;
      else
        findDynamicRoute += hasEventHook ? `new Response(error404Message,{status:c.set.status===200?404:c.set.status,headers:c.set.headers})` : `error404.clone()`;
      return {
        declare: hasErrorHook ? "" : `const error404Message=notFound.message.toString()
const error404=new Response(error404Message,{status:404})
`,
        code: findDynamicRoute
      };
    }
  },
  composeError: {
    mapResponseContext: "",
    validationError: `return new Response(error.message,{headers:Object.assign({'content-type':'application/json'},set.headers),status:set.status})`,
    unknownError: `return new Response(error.message,{headers:set.headers,status:error.status??set.status??500})`
  },
  listen() {
    return () => {
      throw new Error(
        "WebStandard does not support listen, you might want to export default Elysia.fetch instead"
      );
    };
  }
};
const createNativeStaticHandler = (handle, hooks, setHeaders = {}) => {
  if (typeof handle === "function" || handle instanceof Blob) return;
  const response = mapResponse(handle, {
    headers: setHeaders
  });
  if (hooks.parse.length === 0 && hooks.transform.length === 0 && hooks.beforeHandle.length === 0 && hooks.afterHandle.length === 0) {
    if (!response.headers.has("content-type"))
      response.headers.append("content-type", "text/plain;charset=utf-8");
    return response.clone.bind(response);
  }
};
const websocket = {
  open(ws) {
    var _a2, _b;
    (_b = (_a2 = ws.data).open) == null ? void 0 : _b.call(_a2, ws);
  },
  message(ws, message) {
    var _a2, _b;
    (_b = (_a2 = ws.data).message) == null ? void 0 : _b.call(_a2, ws, message);
  },
  drain(ws) {
    var _a2, _b;
    (_b = (_a2 = ws.data).drain) == null ? void 0 : _b.call(_a2, ws);
  },
  close(ws, code, reason) {
    var _a2, _b;
    (_b = (_a2 = ws.data).close) == null ? void 0 : _b.call(_a2, ws, code, reason);
  }
};
class ElysiaWS {
  constructor(raw, data, body = void 0) {
    var _a2;
    this.raw = raw;
    this.data = data;
    this.body = body;
    this.validator = (_a2 = raw.data) == null ? void 0 : _a2.validator;
    this.sendText = raw.sendText.bind(raw);
    this.sendBinary = raw.sendBinary.bind(raw);
    this.close = raw.close.bind(raw);
    this.terminate = raw.terminate.bind(raw);
    this.publishText = raw.publishText.bind(raw);
    this.publishBinary = raw.publishBinary.bind(raw);
    this.subscribe = raw.subscribe.bind(raw);
    this.unsubscribe = raw.unsubscribe.bind(raw);
    this.isSubscribed = raw.isSubscribed.bind(raw);
    this.cork = raw.cork.bind(raw);
    this.remoteAddress = raw.remoteAddress;
    this.binaryType = raw.binaryType;
    this.data = raw.data;
    this.send = this.send.bind(this);
    this.ping = this.ping.bind(this);
    this.pong = this.pong.bind(this);
    this.publish = this.publish.bind(this);
  }
  get id() {
    return this.data.id;
  }
  /**
   * Sends a message to the client.
   *
   * @param data The data to send.
   * @param compress Should the data be compressed? If the client does not support compression, this is ignored.
   * @example
   * ws.send("Hello!");
   * ws.send("Compress this.", true);
   * ws.send(new Uint8Array([1, 2, 3, 4]));
   */
  send(data, compress) {
    var _a2;
    if (Buffer.isBuffer(data))
      return this.raw.send(data, compress);
    if (((_a2 = this.validator) == null ? void 0 : _a2.Check(data)) === false)
      return this.raw.send(
        new ValidationError("message", this.validator, data).message
      );
    if (typeof data === "object") data = JSON.stringify(data);
    return this.raw.send(data, compress);
  }
  /**
   * Sends a ping.
   *
   * @param data The data to send
   */
  ping(data) {
    var _a2;
    if (Buffer.isBuffer(data))
      return this.raw.ping(data);
    if (((_a2 = this.validator) == null ? void 0 : _a2.Check(data)) === false)
      return this.raw.send(
        new ValidationError("message", this.validator, data).message
      );
    if (typeof data === "object") data = JSON.stringify(data);
    return this.raw.ping(data);
  }
  /**
   * Sends a pong.
   *
   * @param data The data to send
   */
  pong(data) {
    var _a2;
    if (Buffer.isBuffer(data))
      return this.raw.pong(data);
    if (((_a2 = this.validator) == null ? void 0 : _a2.Check(data)) === false)
      return this.raw.send(
        new ValidationError("message", this.validator, data).message
      );
    if (typeof data === "object") data = JSON.stringify(data);
    return this.raw.pong(data);
  }
  /**
   * Sends a message to subscribers of the topic.
   *
   * @param topic The topic name.
   * @param data The data to send.
   * @param compress Should the data be compressed? If the client does not support compression, this is ignored.
   * @example
   * ws.publish("chat", "Hello!");
   * ws.publish("chat", "Compress this.", true);
   * ws.publish("chat", new Uint8Array([1, 2, 3, 4]));
   */
  publish(topic, data, compress) {
    var _a2;
    if (Buffer.isBuffer(data))
      return this.raw.publish(
        topic,
        data,
        compress
      );
    if (((_a2 = this.validator) == null ? void 0 : _a2.Check(data)) === false)
      return this.raw.send(
        new ValidationError("message", this.validator, data).message
      );
    if (typeof data === "object") data = JSON.stringify(data);
    return this.raw.publish(topic, data, compress);
  }
  get readyState() {
    return this.raw.readyState;
  }
}
const createWSMessageParser = (parse) => {
  const parsers = typeof parse === "function" ? [parse] : parse;
  return async function parseMessage(ws, message) {
    if (typeof message === "string") {
      const start = message == null ? void 0 : message.charCodeAt(0);
      if (start === 47 || start === 123)
        try {
          message = JSON.parse(message);
        } catch {
        }
      else if (isNumericString(message)) message = +message;
    }
    if (parsers)
      for (let i = 0; i < parsers.length; i++) {
        let temp = parsers[i](ws, message);
        if (temp instanceof Promise) temp = await temp;
        if (temp !== void 0) return temp;
      }
    return message;
  };
};
const createHandleWSResponse = (validateResponse) => {
  const handleWSResponse = (ws, data) => {
    if (data instanceof Promise)
      return data.then((data2) => handleWSResponse(ws, data2));
    if (Buffer.isBuffer(data)) return ws.send(data.toString());
    if (data === void 0) return;
    const send = (datum) => {
      if ((validateResponse == null ? void 0 : validateResponse.Check(datum)) === false)
        return ws.send(
          new ValidationError("message", validateResponse, datum).message
        );
      if (typeof datum === "object") return ws.send(JSON.stringify(datum));
      ws.send(datum);
    };
    if (typeof (data == null ? void 0 : data.next) !== "function")
      return void send(data);
    const init = data.next();
    if (init instanceof Promise)
      return (async () => {
        const first = await init;
        if ((validateResponse == null ? void 0 : validateResponse.Check(first)) === false)
          return ws.send(
            new ValidationError("message", validateResponse, first).message
          );
        send(first.value);
        if (!first.done)
          for await (const datum of data) send(datum);
      })();
    send(init.value);
    if (!init.done) for (const datum of data) send(datum);
  };
  return handleWSResponse;
};
const BunAdapter = {
  ...WebStandardAdapter,
  name: "bun",
  handler: {
    ...WebStandardAdapter.handler,
    createNativeStaticHandler
  },
  composeHandler: {
    ...WebStandardAdapter.composeHandler,
    headers: hasHeaderShorthand ? "c.headers = c.request.headers.toJSON()\n" : "c.headers = {}\nfor (const [key, value] of c.request.headers.entries())c.headers[key] = value\n"
  },
  listen(app) {
    return (options, callback) => {
      if (typeof Bun === "undefined")
        throw new Error(
          ".listen() is designed to run on Bun only. If you are running Elysia in other environment please use a dedicated plugin or export the handler via Elysia.fetch"
        );
      app.compile();
      if (typeof options === "string") {
        if (!isNumericString(options))
          throw new Error("Port must be a numeric value");
        options = parseInt(options);
      }
      const fetch = app.fetch;
      const serve = typeof options === "object" ? {
        development: !isProduction,
        reusePort: true,
        ...app.config.serve || {},
        ...options || {},
        // @ts-ignore
        static: app.router.static.http.static,
        websocket: {
          ...app.config.websocket || {},
          ...websocket
        },
        fetch,
        // @ts-expect-error private property
        error: app.outerErrorHandler
      } : {
        development: !isProduction,
        reusePort: true,
        ...app.config.serve || {},
        // @ts-ignore
        static: app.router.static.http.static,
        websocket: {
          ...app.config.websocket || {},
          ...websocket
        },
        port: options,
        fetch,
        // @ts-expect-error private property
        error: app.outerErrorHandler
      };
      app.server = Bun == null ? void 0 : Bun.serve(serve);
      for (let i = 0; i < app.event.start.length; i++)
        app.event.start[i].fn(app);
      if (callback) callback(app.server);
      process.on("beforeExit", () => {
        if (app.server) {
          app.server.stop();
          app.server = null;
          for (let i = 0; i < app.event.stop.length; i++)
            app.event.stop[i].fn(app);
        }
      });
      app.promisedModules.then(() => {
        Bun == null ? void 0 : Bun.gc(false);
      });
    };
  },
  ws(app, path, options) {
    const { parse, body, response, ...rest } = options;
    const validateMessage = getSchemaValidator(body, {
      // @ts-expect-error private property
      modules: app.definitions.typebox,
      // @ts-expect-error private property
      models: app.definitions.type,
      normalize: app.config.normalize
    });
    const validateResponse = getSchemaValidator(response, {
      // @ts-expect-error private property
      modules: app.definitions.typebox,
      // @ts-expect-error private property
      models: app.definitions.type,
      normalize: app.config.normalize
    });
    app.route(
      "$INTERNALWS",
      path,
      async (context) => {
        const server = app.getServer();
        const { set: set2, path: path2, qi, headers, query, params } = context;
        context.validator = validateResponse;
        if (options.upgrade) {
          if (typeof options.upgrade === "function") {
            const temp = options.upgrade(context);
            if (temp instanceof Promise) await temp;
          } else if (options.upgrade)
            Object.assign(
              set2.headers,
              options.upgrade
            );
        }
        if (set2.cookie && isNotEmpty(set2.cookie)) {
          const cookie = serializeCookie(set2.cookie);
          if (cookie) set2.headers["set-cookie"] = cookie;
        }
        if (set2.headers["set-cookie"] && Array.isArray(set2.headers["set-cookie"]))
          set2.headers = parseSetCookies(
            new Headers(set2.headers),
            set2.headers["set-cookie"]
          );
        const handleResponse = createHandleWSResponse(validateResponse);
        const parseMessage = createWSMessageParser(parse);
        let _id;
        if (server == null ? void 0 : server.upgrade(context.request, {
          headers: isNotEmpty(set2.headers) ? set2.headers : void 0,
          data: {
            ...context,
            get id() {
              if (_id) return _id;
              return _id = randomId();
            },
            validator: validateResponse,
            ping(data) {
              var _a2;
              (_a2 = options.ping) == null ? void 0 : _a2.call(options, data);
            },
            pong(data) {
              var _a2;
              (_a2 = options.pong) == null ? void 0 : _a2.call(options, data);
            },
            open(ws) {
              var _a2;
              handleResponse(
                ws,
                (_a2 = options.open) == null ? void 0 : _a2.call(
                  options,
                  new ElysiaWS(ws, context)
                )
              );
            },
            message: async (ws, _message) => {
              var _a2;
              const message = await parseMessage(ws, _message);
              if ((validateMessage == null ? void 0 : validateMessage.Check(message)) === false)
                return void ws.send(
                  new ValidationError(
                    "message",
                    validateMessage,
                    message
                  ).message
                );
              handleResponse(
                ws,
                (_a2 = options.message) == null ? void 0 : _a2.call(
                  options,
                  new ElysiaWS(
                    ws,
                    context,
                    message
                  ),
                  message
                )
              );
            },
            drain(ws) {
              var _a2;
              handleResponse(
                ws,
                (_a2 = options.drain) == null ? void 0 : _a2.call(
                  options,
                  new ElysiaWS(ws, context)
                )
              );
            },
            close(ws, code, reason) {
              var _a2;
              handleResponse(
                ws,
                (_a2 = options.close) == null ? void 0 : _a2.call(
                  options,
                  new ElysiaWS(ws, context),
                  code,
                  reason
                )
              );
            }
          }
        }))
          return;
        set2.status = 400;
        return "Expected a websocket connection";
      },
      {
        ...rest,
        websocket: options
      }
    );
  }
};
const isBun = typeof Bun !== "undefined";
const env = isBun ? Bun.env : typeof process !== "undefined" && process.env ? process.env : {};
const plusRegex = /\+/g;
function parseQueryFromURL(input) {
  const result = {};
  if (typeof input !== "string") return result;
  let key = "";
  let value = "";
  let startingIndex = -1;
  let equalityIndex = -1;
  let flags = 0;
  const l = input.length;
  for (let i = 0; i < l; i++) {
    switch (input.charCodeAt(i)) {
      case 38:
        const hasBothKeyValuePair = equalityIndex > startingIndex;
        if (!hasBothKeyValuePair) equalityIndex = i;
        key = input.slice(startingIndex + 1, equalityIndex);
        if (hasBothKeyValuePair || key.length > 0) {
          if (flags & 1) key = key.replace(plusRegex, " ");
          if (flags & 2) key = decode(key) || key;
          if (!result[key]) {
            if (hasBothKeyValuePair) {
              value = input.slice(equalityIndex + 1, i);
              if (flags & 4)
                value = value.replace(plusRegex, " ");
              if (flags & 8)
                value = decode(value) || value;
            }
            result[key] = value;
          }
        }
        key = "";
        value = "";
        startingIndex = i;
        equalityIndex = i;
        flags = 0;
        break;
      case 61:
        if (equalityIndex <= startingIndex) equalityIndex = i;
        else flags |= 8;
        break;
      case 43:
        if (equalityIndex > startingIndex) flags |= 4;
        else flags |= 1;
        break;
      case 37:
        if (equalityIndex > startingIndex) flags |= 8;
        else flags |= 2;
        break;
    }
  }
  if (startingIndex < l) {
    const hasBothKeyValuePair = equalityIndex > startingIndex;
    key = input.slice(
      startingIndex + 1,
      hasBothKeyValuePair ? equalityIndex : l
    );
    if (hasBothKeyValuePair || key.length > 0) {
      if (flags & 1) key = key.replace(plusRegex, " ");
      if (flags & 2) key = decode(key) || key;
      if (!result[key]) {
        if (hasBothKeyValuePair) {
          value = input.slice(equalityIndex + 1, l);
          if (flags & 4)
            value = value.replace(plusRegex, " ");
          if (flags & 8) value = decode(value) || value;
        }
        result[key] = value;
      }
    }
  }
  return result;
}
const parseQuery = (input) => {
  const result = {};
  if (typeof input !== "string") return result;
  const inputLength = input.length;
  let key = "";
  let value = "";
  let startingIndex = -1;
  let equalityIndex = -1;
  let shouldDecodeKey = false;
  let shouldDecodeValue = false;
  let keyHasPlus = false;
  let valueHasPlus = false;
  let hasBothKeyValuePair = false;
  let c = 0;
  for (let i = 0; i < inputLength + 1; i++) {
    if (i !== inputLength) c = input.charCodeAt(i);
    else c = 38;
    switch (c) {
      case 38: {
        hasBothKeyValuePair = equalityIndex > startingIndex;
        if (!hasBothKeyValuePair) equalityIndex = i;
        key = input.slice(startingIndex + 1, equalityIndex);
        if (hasBothKeyValuePair || key.length > 0) {
          if (keyHasPlus) key = key.replace(plusRegex, " ");
          if (shouldDecodeKey) key = decode(key) || key;
          if (hasBothKeyValuePair) {
            value = input.slice(equalityIndex + 1, i);
            if (valueHasPlus) value = value.replace(plusRegex, " ");
            if (shouldDecodeValue)
              value = decode(value) || value;
          }
          const currentValue = result[key];
          if (currentValue === void 0)
            result[key] = value;
          else {
            if (currentValue.pop) currentValue.push(value);
            else result[key] = [currentValue, value];
          }
        }
        value = "";
        startingIndex = i;
        equalityIndex = i;
        shouldDecodeKey = false;
        shouldDecodeValue = false;
        keyHasPlus = false;
        valueHasPlus = false;
        break;
      }
      // Check '='
      case 61:
        if (equalityIndex <= startingIndex) equalityIndex = i;
        else shouldDecodeValue = true;
        break;
      // Check '+', and remember to replace it with empty space.
      case 43:
        if (equalityIndex > startingIndex) valueHasPlus = true;
        else keyHasPlus = true;
        break;
      // Check '%' character for encoding
      case 37:
        if (equalityIndex > startingIndex) shouldDecodeValue = true;
        else shouldDecodeKey = true;
        break;
    }
  }
  return result;
};
const ELYSIA_TRACE = Symbol("ElysiaTrace");
const createProcess = () => {
  const { promise, resolve } = Promise.withResolvers();
  const { promise: end, resolve: resolveEnd } = Promise.withResolvers();
  const { promise: error2, resolve: resolveError } = Promise.withResolvers();
  const callbacks = [];
  const callbacksEnd = [];
  return [
    (callback) => {
      if (callback) callbacks.push(callback);
      return promise;
    },
    (process2) => {
      const processes = [];
      const resolvers = [];
      let groupError = null;
      for (let i = 0; i < (process2.total ?? 0); i++) {
        const { promise: promise2, resolve: resolve2 } = Promise.withResolvers();
        const { promise: end2, resolve: resolveEnd2 } = Promise.withResolvers();
        const { promise: error22, resolve: resolveError2 } = Promise.withResolvers();
        const callbacks2 = [];
        const callbacksEnd2 = [];
        processes.push((callback) => {
          if (callback) callbacks2.push(callback);
          return promise2;
        });
        resolvers.push((process22) => {
          const result2 = {
            ...process22,
            end: end2,
            error: error22,
            index: i,
            onStop(callback) {
              if (callback) callbacksEnd2.push(callback);
              return end2;
            }
          };
          resolve2(result2);
          for (let i2 = 0; i2 < callbacks2.length; i2++)
            callbacks2[i2](result2);
          return (error3 = null) => {
            const end3 = performance.now();
            if (error3) groupError = error3;
            const detail = {
              end: end3,
              error: error3,
              get elapsed() {
                return end3 - process22.begin;
              }
            };
            for (let i2 = 0; i2 < callbacksEnd2.length; i2++)
              callbacksEnd2[i2](detail);
            resolveEnd2(end3);
            resolveError2(error3);
          };
        });
      }
      const result = {
        ...process2,
        end,
        error: error2,
        onEvent(callback) {
          for (let i = 0; i < processes.length; i++)
            processes[i](callback);
        },
        onStop(callback) {
          if (callback) callbacksEnd.push(callback);
          return end;
        }
      };
      resolve(result);
      for (let i = 0; i < callbacks.length; i++) callbacks[i](result);
      return {
        resolveChild: resolvers,
        resolve(error22 = null) {
          const end2 = performance.now();
          if (!error22 && groupError) error22 = groupError;
          const detail = {
            end: end2,
            error: error22,
            get elapsed() {
              return end2 - process2.begin;
            }
          };
          for (let i = 0; i < callbacksEnd.length; i++)
            callbacksEnd[i](detail);
          resolveEnd(end2);
          resolveError(error22);
        }
      };
    }
  ];
};
const createTracer = (traceListener) => {
  return (context) => {
    const [onRequest, resolveRequest] = createProcess();
    const [onParse, resolveParse] = createProcess();
    const [onTransform, resolveTransform] = createProcess();
    const [onBeforeHandle, resolveBeforeHandle] = createProcess();
    const [onHandle, resolveHandle] = createProcess();
    const [onAfterHandle, resolveAfterHandle] = createProcess();
    const [onError, resolveError] = createProcess();
    const [onMapResponse, resolveMapResponse] = createProcess();
    const [onAfterResponse, resolveAfterResponse] = createProcess();
    traceListener({
      // @ts-ignore
      id: context[ELYSIA_REQUEST_ID],
      context,
      set: context.set,
      // @ts-ignore
      onRequest,
      // @ts-ignore
      onParse,
      // @ts-ignore
      onTransform,
      // @ts-ignore
      onBeforeHandle,
      // @ts-ignore
      onHandle,
      // @ts-ignore
      onAfterHandle,
      // @ts-ignore
      onMapResponse,
      // @ts-ignore
      onAfterResponse,
      // @ts-ignore
      onError
    });
    return {
      request: resolveRequest,
      parse: resolveParse,
      transform: resolveTransform,
      beforeHandle: resolveBeforeHandle,
      handle: resolveHandle,
      afterHandle: resolveAfterHandle,
      error: resolveError,
      mapResponse: resolveMapResponse,
      afterResponse: resolveAfterResponse
    };
  };
};
const TypeBoxSymbol = {
  optional: Symbol.for("TypeBox.Optional"),
  kind: Symbol.for("TypeBox.Kind")
};
const isOptional = (validator) => {
  if (!validator) return false;
  const schema = validator == null ? void 0 : validator.schema;
  if ((schema == null ? void 0 : schema[TypeBoxSymbol.kind]) === "Import")
    return validator.References().some(isOptional);
  return !!schema && TypeBoxSymbol.optional in schema;
};
const defaultParsers = [
  "json",
  "text",
  "urlencoded",
  "arrayBuffer",
  "formdata",
  "application/json",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "text/plain",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "application/x-www-form-urlencoded",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "application/octet-stream",
  // eslint-disable-next-line sonarjs/no-duplicate-string
  "multipart/form-data"
];
const hasAdditionalProperties = (_schema) => {
  if (!_schema) return false;
  const schema = (_schema == null ? void 0 : _schema.schema) ?? _schema;
  if (schema[TypeBoxSymbol.kind] === "Import" && _schema.References()) {
    return _schema.References().some(hasAdditionalProperties);
  }
  if (schema.anyOf) return schema.anyOf.some(hasAdditionalProperties);
  if (schema.someOf) return schema.someOf.some(hasAdditionalProperties);
  if (schema.allOf) return schema.allOf.some(hasAdditionalProperties);
  if (schema.not) return schema.not.some(hasAdditionalProperties);
  if (schema.type === "object") {
    const properties = schema.properties;
    if ("additionalProperties" in schema) return schema.additionalProperties;
    if ("patternProperties" in schema) return false;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (property.type === "object") {
        if (hasAdditionalProperties(property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++)
          if (hasAdditionalProperties(property.anyOf[i])) return true;
      }
      return property.additionalProperties;
    }
    return false;
  }
  return false;
};
const createReport = ({
  context = "c",
  trace,
  addFn
}) => {
  if (!trace.length)
    return () => {
      return {
        resolveChild() {
          return () => {
          };
        },
        resolve() {
        }
      };
    };
  for (let i = 0; i < trace.length; i++)
    addFn(
      `let report${i}, reportChild${i}, reportErr${i}, reportErrChild${i};let trace${i} = ${context}[ELYSIA_TRACE]?.[${i}] ?? trace[${i}](${context});
`
    );
  return (event, {
    name,
    total = 0
  } = {}) => {
    if (!name) name = "anonymous";
    const reporter = event === "error" ? "reportErr" : "report";
    for (let i = 0; i < trace.length; i++)
      addFn(
        `${reporter}${i} = trace${i}.${event}({id,event:'${event}',name:'${name}',begin:performance.now(),total:${total}})
`
      );
    return {
      resolve() {
        for (let i = 0; i < trace.length; i++)
          addFn(`${reporter}${i}.resolve()
`);
      },
      resolveChild(name2) {
        for (let i = 0; i < trace.length; i++)
          addFn(
            `${reporter}Child${i}=${reporter}${i}.resolveChild?.shift()?.({id,event:'${event}',name:'${name2}',begin:performance.now()})
`
          );
        return (binding) => {
          for (let i = 0; i < trace.length; i++) {
            if (binding)
              addFn(
                `if(${binding} instanceof Error){${reporter}Child${i}?.(${binding}) }else{${reporter}Child${i}?.()}`
              );
            else addFn(`${reporter}Child${i}?.()
`);
          }
        };
      }
    };
  };
};
const composeValidationFactory = ({
  injectResponse = "",
  normalize: normalize2 = false,
  validator
}) => ({
  composeValidation: (type2, value = `c.${type2}`) => `c.set.status=422;throw new ValidationError('${type2}',validator.${type2},${value})`,
  composeResponseValidation: (name = "r") => {
    let code = injectResponse + "\n";
    code += `if(${name} instanceof ElysiaCustomStatusResponse){c.set.status=${name}.code
${name}=${name}.response}const isResponse=${name} instanceof Response
switch(c.set.status){`;
    for (const [status, value] of Object.entries(
      validator.response
    )) {
      code += `
case ${status}:if(!isResponse){`;
      if (normalize2 && "Clean" in value && !hasAdditionalProperties(value))
        code += `${name}=validator.response['${status}'].Clean(${name})
`;
      code += `if(validator.response['${status}'].Check(${name})===false){c.set.status=422
throw new ValidationError('response',validator.response['${status}'],${name})}c.set.status = ${status}}break
`;
    }
    return code + "}";
  }
});
const hasProperty = (expectedProperty, _schema) => {
  if (!_schema) return;
  const schema = _schema.schema ?? _schema;
  if (schema[TypeBoxSymbol.kind] === "Import")
    return _schema.References().some((schema2) => hasProperty(expectedProperty, schema2));
  if (schema.type === "object") {
    const properties = schema.properties;
    if (!properties) return false;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (expectedProperty in property) return true;
      if (property.type === "object") {
        if (hasProperty(expectedProperty, property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++) {
          if (hasProperty(expectedProperty, property.anyOf[i]))
            return true;
        }
      }
    }
    return false;
  }
  return expectedProperty in schema;
};
const TransformSymbol = Symbol.for("TypeBox.Transform");
const hasTransform = (schema) => {
  if (!schema) return;
  if (schema.type === "object" && schema.properties) {
    const properties = schema.properties;
    for (const key of Object.keys(properties)) {
      const property = properties[key];
      if (property.type === "object") {
        if (hasTransform(property)) return true;
      } else if (property.anyOf) {
        for (let i = 0; i < property.anyOf.length; i++)
          if (hasTransform(property.anyOf[i])) return true;
      }
      const hasTransformSymbol = TransformSymbol in property;
      if (hasTransformSymbol) return true;
    }
    return false;
  }
  return TransformSymbol in schema || schema.properties && TransformSymbol in schema.properties;
};
const matchFnReturn = /(?:return|=>) \S+\(/g;
const isAsyncName = (v) => {
  const fn = (v == null ? void 0 : v.fn) ?? v;
  return fn.constructor.name === "AsyncFunction";
};
const isAsync = (v) => {
  const fn = (v == null ? void 0 : v.fn) ?? v;
  if (fn.constructor.name === "AsyncFunction") return true;
  const literal = fn.toString();
  if (literal.includes("=> response.clone(")) return false;
  if (literal.includes("await")) return true;
  if (literal.includes("async")) return true;
  if (literal.includes("=>response.clone(")) return false;
  return !!literal.match(matchFnReturn);
};
const isGenerator = (v) => {
  const fn = (v == null ? void 0 : v.fn) ?? v;
  return fn.constructor.name === "AsyncGeneratorFunction" || fn.constructor.name === "GeneratorFunction";
};
const composeHandler = ({
  app,
  path,
  method,
  localHook,
  hooks,
  validator,
  handler,
  allowMeta = false,
  inference,
  asManifest = false
}) => {
  var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E;
  const adapter = app["~adapter"].composeHandler;
  const adapterHandler = app["~adapter"].handler;
  const isHandleFn = typeof handler === "function";
  if (!isHandleFn) {
    handler = adapterHandler.mapResponse(handler, {
      // @ts-expect-error private property
      headers: app.setHeaders ?? {}
    });
    if (hooks.parse.length === 0 && hooks.transform.length === 0 && hooks.beforeHandle.length === 0 && hooks.afterHandle.length === 0) {
      if (handler instanceof Response)
        return Function(
          "a",
          `return function(){return a.clone()}`
        )(handler);
      return Function("a", "return function(){return a}")(handler);
    }
  }
  const handle = isHandleFn ? `handler(c)` : `handler`;
  const hasAfterResponse = hooks.afterResponse.length > 0;
  const hasTrace = hooks.trace.length > 0;
  let fnLiteral = "";
  inference = sucrose(
    Object.assign(localHook, {
      handler
    }),
    inference
  );
  if (adapter.declare) {
    const literal = adapter.declare(inference);
    if (literal) fnLiteral += literal;
  }
  if (inference.server)
    fnLiteral += "Object.defineProperty(c,'server',{get:function(){return getServer()}})\n";
  (_a2 = validator.createBody) == null ? void 0 : _a2.call(validator);
  (_b = validator.createQuery) == null ? void 0 : _b.call(validator);
  (_c = validator.createHeaders) == null ? void 0 : _c.call(validator);
  (_d = validator.createParams) == null ? void 0 : _d.call(validator);
  (_e = validator.createCookie) == null ? void 0 : _e.call(validator);
  (_f = validator.createResponse) == null ? void 0 : _f.call(validator);
  const hasQuery = inference.query || !!validator.query;
  const hasBody = method !== "$INTERNALWS" && method !== "GET" && method !== "HEAD" && (inference.body || !!validator.body || hooks.parse.length);
  if (hasBody) fnLiteral += `let isParsing=false
`;
  const defaultHeaders = app.setHeaders;
  const hasDefaultHeaders = defaultHeaders && !!Object.keys(defaultHeaders).length;
  const hasHeaders = inference.headers || validator.headers || adapter.preferWebstandardHeaders !== true && inference.body;
  const hasCookie = inference.cookie || !!validator.cookie;
  const cookieValidator = hasCookie ? getCookieValidator({
    // @ts-expect-error private property
    modules: app.definitions.typebox,
    validator: validator.cookie,
    defaultConfig: app.config.cookie,
    dynamic: !!app.config.aot,
    // @ts-expect-error
    config: ((_g = validator.cookie) == null ? void 0 : _g.config) ?? {},
    // @ts-expect-error
    models: app.definitions.type
  }) : void 0;
  const cookieMeta = cookieValidator == null ? void 0 : cookieValidator.config;
  let encodeCookie = "";
  if (cookieMeta == null ? void 0 : cookieMeta.sign) {
    if (!cookieMeta.secrets)
      throw new Error(
        `t.Cookie required secret which is not set in (${method}) ${path}.`
      );
    const secret = !cookieMeta.secrets ? void 0 : typeof cookieMeta.secrets === "string" ? cookieMeta.secrets : cookieMeta.secrets[0];
    encodeCookie += "const _setCookie = c.set.cookie\nif(_setCookie){";
    if (cookieMeta.sign === true) {
      encodeCookie += `for(const [key, cookie] of Object.entries(_setCookie)){c.set.cookie[key].value=await signCookie(cookie.value,'${secret}')}`;
    } else
      for (const name of cookieMeta.sign)
        encodeCookie += `if(_setCookie['${name}']?.value){c.set.cookie['${name}'].value=await signCookie(_setCookie['${name}'].value,'${secret}')}`;
    encodeCookie += "}\n";
  }
  const normalize2 = app.config.normalize;
  const { composeValidation, composeResponseValidation } = composeValidationFactory({
    normalize: normalize2,
    validator
  });
  if (hasHeaders) fnLiteral += adapter.headers;
  if (hasTrace) fnLiteral += "const id=c[ELYSIA_REQUEST_ID]\n";
  const report = createReport({
    trace: hooks.trace,
    addFn: (word) => {
      fnLiteral += word;
    }
  });
  fnLiteral += "try{";
  if (hasCookie) {
    const get = (name, defaultValue) => {
      const value = (cookieMeta == null ? void 0 : cookieMeta[name]) ?? defaultValue;
      if (!value)
        return typeof defaultValue === "string" ? `${name}:"${defaultValue}",` : `${name}:${defaultValue},`;
      if (typeof value === "string") return `${name}:'${value}',`;
      if (value instanceof Date)
        return `${name}: new Date(${value.getTime()}),`;
      return `${name}:${value},`;
    };
    const options = cookieMeta ? `{secrets:${cookieMeta.secrets !== void 0 ? typeof cookieMeta.secrets === "string" ? `'${cookieMeta.secrets}'` : "[" + cookieMeta.secrets.reduce(
      (a2, b) => a2 + `'${b}',`,
      ""
    ) + "]" : "undefined"},sign:${cookieMeta.sign === true ? true : cookieMeta.sign !== void 0 ? "[" + cookieMeta.sign.reduce(
      (a2, b) => a2 + `'${b}',`,
      ""
    ) + "]" : "undefined"},` + get("domain") + get("expires") + get("httpOnly") + get("maxAge") + get("path", "/") + get("priority") + get("sameSite") + get("secure") + "}" : "undefined";
    if (hasHeaders)
      fnLiteral += `
c.cookie=await parseCookie(c.set,c.headers.cookie,${options})
`;
    else
      fnLiteral += `
c.cookie=await parseCookie(c.set,c.request.headers.get('cookie'),${options})
`;
  }
  if (hasQuery) {
    const destructured = [];
    if (validator.query && validator.query.schema.type === "object") {
      const properties = validator.query.schema.properties;
      if (!hasAdditionalProperties(validator.query))
        for (let [key, _value] of Object.entries(properties)) {
          let value = _value;
          if (value && TypeBoxSymbol.optional in value && value.type === "array" && value.items)
            value = value.items;
          const { type: type2, anyOf } = value;
          const isArray = type2 === "array" || (anyOf == null ? void 0 : anyOf.some(
            (v) => v.type === "string" && v.format === "ArrayString"
          ));
          destructured.push({
            key,
            isArray,
            isNestedObjectArray: isArray && ((_h = value.items) == null ? void 0 : _h.type) === "object" || !!((_j = (_i = value.items) == null ? void 0 : _i.anyOf) == null ? void 0 : _j.some(
              // @ts-expect-error
              (x) => x.type === "object" || x.type === "array"
            )),
            isObject: type2 === "object" || (anyOf == null ? void 0 : anyOf.some(
              (v) => v.type === "string" && v.format === "ArrayString"
            )),
            anyOf: !!anyOf
          });
        }
    }
    if (!destructured.length) {
      fnLiteral += "if(c.qi===-1){c.query={}}else{c.query=parseQueryFromURL(c.url.slice(c.qi + 1))}";
    } else {
      fnLiteral += `if(c.qi!==-1){let url = '&' + decodeURIComponent(c.url.slice(c.qi + 1))
`;
      let index = 0;
      for (const {
        key,
        isArray,
        isObject: isObject2,
        isNestedObjectArray,
        anyOf
      } of destructured) {
        const init2 = (index === 0 ? "let " : "") + `memory=url.indexOf('&${key}=')
let a${index}
`;
        if (isArray) {
          fnLiteral += init2;
          if (isNestedObjectArray)
            fnLiteral += `while(memory!==-1){const start=memory+${key.length + 2}
memory=url.indexOf('&',start)
if(a${index}===undefined)
a${index}=''
else
a${index}+=','
let temp
if(memory===-1)temp=decodeURIComponent(url.slice(start).replace(/\\+/g,' '))
else temp=decodeURIComponent(url.slice(start, memory).replace(/\\+/g,' '))
const charCode = temp.charCodeAt(0)
if(charCode !== 91 && charCode !== 123)
temp='"'+temp+'"'
a${index} += temp
if(memory === -1)break
memory=url.indexOf('&${key}=',memory)
if(memory === -1)break}try{if(a${index}.charCodeAt(0) === 91)a${index} = JSON.parse(a${index})
else
a${index}=JSON.parse('['+a${index}+']')}catch{}
`;
          else
            fnLiteral += `while(memory!==-1){const start=memory+${key.length + 2}
memory=url.indexOf('&',start)
if(a${index}===undefined)a${index}=[]
if(memory===-1){a${index}.push(decodeURIComponent(url.slice(start)).replace(/\\+/g,' '))
break}else a${index}.push(decodeURIComponent(url.slice(start, memory)).replace(/\\+/g,' '))
memory=url.indexOf('&${key}=',memory)
if(memory===-1) break
}`;
        } else if (isObject2)
          fnLiteral += init2 + `if(memory!==-1){const start=memory+${key.length + 2}
memory=url.indexOf('&',start)
if(memory===-1)a${index}=decodeURIComponent(url.slice(start).replace(/\\+/g,' '))else a${index}=decodeURIComponent(url.slice(start,memory).replace(/\\+/g,' '))if(a${index}!==undefined)try{a${index}=JSON.parse(a${index})}catch{}}`;
        else {
          fnLiteral += init2 + `if(memory!==-1){const start=memory+${key.length + 2}
memory=url.indexOf('&',start)
if(memory===-1)a${index}=decodeURIComponent(url.slice(start).replace(/\\+/g,' '))
else{a${index}=decodeURIComponent(url.slice(start,memory).replace(/\\+/g,' '))`;
          if (anyOf)
            fnLiteral += `
let deepMemory=url.indexOf('&${key}=',memory)
if(deepMemory!==-1){a${index}=[a${index}]
let first=true
while(true){const start=deepMemory+${key.length + 2}
if(first)first=false
else deepMemory = url.indexOf('&', start)
let value
if(deepMemory===-1)value=decodeURIComponent(url.slice(start).replace(/\\+/g,' '))
else value=decodeURIComponent(url.slice(start, deepMemory).replace(/\\+/g,' '))
const vStart=value.charCodeAt(0)
const vEnd=value.charCodeAt(value.length - 1)
if((vStart===91&&vEnd===93)||(vStart===123&&vEnd===125))
try{a${index}.push(JSON.parse(value))}catch{a${index}.push(value)}if(deepMemory===-1)break}}`;
          fnLiteral += "}}";
        }
        index++;
        fnLiteral += "\n";
      }
      fnLiteral += `c.query={` + destructured.map(({ key }, index2) => `'${key}':a${index2}`).join(",") + `}`;
      fnLiteral += `} else c.query = {}
`;
    }
  }
  const isAsyncHandler = typeof handler === "function" && isAsync(handler);
  const saveResponse = hasTrace || hooks.afterResponse.length > 0 ? "c.response= " : "";
  const maybeAsync = hasCookie || hasBody || isAsyncHandler || hooks.parse.length > 0 || hooks.afterHandle.some(isAsync) || hooks.beforeHandle.some(isAsync) || hooks.transform.some(isAsync) || hooks.mapResponse.some(isAsync);
  const maybeStream = (typeof handler === "function" ? isGenerator(handler) : false) || hooks.beforeHandle.some(isGenerator) || hooks.afterHandle.some(isGenerator) || hooks.transform.some(isGenerator);
  const hasSet = inference.cookie || inference.set || hasHeaders || hasTrace || validator.response || isHandleFn && hasDefaultHeaders || maybeStream;
  const mapResponseContext = adapter.mapResponseContext ? `,${adapter.mapResponseContext}` : "";
  if (inference.route) fnLiteral += `c.route=\`${path}\`
`;
  const parseReporter = report("parse", {
    total: hooks.parse.length
  });
  if (hasBody) {
    const isOptionalBody = isOptional(validator.body);
    const hasBodyInference = hooks.parse.length || inference.body || validator.body;
    if (adapter.parser.declare) fnLiteral += adapter.parser.declare;
    fnLiteral += "\nisParsing=true";
    const parser = typeof hooks.parse === "string" ? hooks.parse : Array.isArray(hooks.parse) && hooks.parse.length === 1 ? typeof hooks.parse[0] === "string" ? hooks.parse[0] : typeof hooks.parse[0].fn === "string" ? hooks.parse[0].fn : void 0 : void 0;
    if (parser && parser in defaultParsers) {
      const reporter = report("parse", {
        total: hooks.parse.length
      });
      switch (parser) {
        case "json":
        case "application/json":
          fnLiteral += adapter.parser.json(isOptionalBody);
          break;
        case "text":
        case "text/plain":
          fnLiteral += adapter.parser.text(isOptionalBody);
          break;
        case "urlencoded":
        case "application/x-www-form-urlencoded":
          fnLiteral += adapter.parser.urlencoded(isOptionalBody);
          break;
        case "arrayBuffer":
        case "application/octet-stream":
          fnLiteral += adapter.parser.arrayBuffer(isOptionalBody);
          break;
        case "formdata":
        case "multipart/form-data":
          fnLiteral += adapter.parser.formData(isOptionalBody);
          break;
        default:
          if (parser[0] in app["~parser"]) {
            fnLiteral += hasHeaders ? `let contentType = c.headers['content-type']` : `let contentType = c.request.headers.get('content-type')`;
            fnLiteral += `
if(contentType){const index=contentType.indexOf(';')
if(index!==-1)contentType=contentType.substring(0, index)}
else{contentType=''}c.contentType=contentType
`;
            fnLiteral += `let result=parser['${parser}'](c, contentType)
if(result instanceof Promise)result=await result
if(result instanceof ElysiaCustomStatusResponse)throw result
if(result!==undefined)c.body=result
delete c.contentType
`;
          }
          break;
      }
      reporter.resolve();
    } else if (hasBodyInference) {
      fnLiteral += "\n";
      fnLiteral += hasHeaders ? `let contentType = c.headers['content-type']` : `let contentType = c.request.headers.get('content-type')`;
      fnLiteral += `
if(contentType){const index=contentType.indexOf(';')
if(index!==-1)contentType=contentType.substring(0, index)}
else{contentType=''}c.contentType=contentType
`;
      if (hooks.parse.length) fnLiteral += `let used=false
`;
      const reporter = report("parse", {
        total: hooks.parse.length
      });
      let hasDefaultParser = false;
      for (let i = 0; i < hooks.parse.length; i++) {
        const name = `bo${i}`;
        if (i !== 0) fnLiteral += `
if(!used){`;
        if (typeof hooks.parse[i].fn === "string") {
          const endUnit = reporter.resolveChild(
            hooks.parse[i].fn
          );
          switch (hooks.parse[i].fn) {
            case "json":
            case "application/json":
              hasDefaultParser = true;
              fnLiteral += adapter.parser.json(isOptionalBody);
              break;
            case "text":
            case "text/plain":
              hasDefaultParser = true;
              fnLiteral += adapter.parser.text(isOptionalBody);
              break;
            case "urlencoded":
            case "application/x-www-form-urlencoded":
              hasDefaultParser = true;
              fnLiteral += adapter.parser.urlencoded(isOptionalBody);
              break;
            case "arrayBuffer":
            case "application/octet-stream":
              hasDefaultParser = true;
              fnLiteral += adapter.parser.arrayBuffer(isOptionalBody);
              break;
            case "formdata":
            case "multipart/form-data":
              hasDefaultParser = true;
              fnLiteral += adapter.parser.formData(isOptionalBody);
              break;
            default:
              fnLiteral += `${name}=parser['${hooks.parse[i].fn}'](c,contentType)
if(${name} instanceof Promise)${name}=await ${name}
if(${name}!==undefined){c.body=${name};used=true}
`;
          }
          endUnit();
        } else {
          const endUnit = reporter.resolveChild(
            hooks.parse[i].fn.name
          );
          fnLiteral += `let ${name}=parse[${i}]
${name}=${name}(c,contentType)
if(${name} instanceof Promise)${name}=await ${name}
if(${name}!==undefined){c.body=${name};used=true}`;
          endUnit();
        }
        if (i !== 0) fnLiteral += `}`;
        if (hasDefaultParser) break;
      }
      reporter.resolve();
      if (!hasDefaultParser) {
        if (hooks.parse.length)
          fnLiteral += `
if(!used){
if(!contentType) throw new ParseError()
`;
        fnLiteral += `switch(contentType){`;
        fnLiteral += `case 'application/json':
` + adapter.parser.json(isOptionalBody) + `break
case 'text/plain':` + adapter.parser.text(isOptionalBody) + `break
case 'application/x-www-form-urlencoded':` + adapter.parser.urlencoded(isOptionalBody) + `break
case 'application/octet-stream':` + adapter.parser.arrayBuffer(isOptionalBody) + `break
case 'multipart/form-data':` + adapter.parser.formData(isOptionalBody) + `break
`;
        for (const key of Object.keys(app["~parser"]))
          fnLiteral += `case '${key}':let bo${key}=parser['${key}'](c,contentType)
if(bo${key} instanceof Promise)bo${key}=await bo${key}
if(bo${key} instanceof ElysiaCustomStatusResponse)throw result
if(bo${key}!==undefined)c.body=bo${key}
break
`;
        if (hooks.parse.length) fnLiteral += "}";
        fnLiteral += "}";
      }
    }
    fnLiteral += "\ndelete c.contentType";
    fnLiteral += "\nisParsing=false\n";
  }
  parseReporter.resolve();
  if (hooks == null ? void 0 : hooks.transform) {
    const reporter = report("transform", {
      total: hooks.transform.length
    });
    if (hooks.transform.length) fnLiteral += "let transformed\n";
    for (let i = 0; i < hooks.transform.length; i++) {
      const transform = hooks.transform[i];
      const endUnit = reporter.resolveChild(transform.fn.name);
      fnLiteral += isAsync(transform) ? `transformed=await transform[${i}](c)
` : `transformed=transform[${i}](c)
`;
      if (transform.subType === "mapDerive")
        fnLiteral += `if(transformed instanceof ElysiaCustomStatusResponse)throw transformed
else{transformed.request=c.request
transformed.store=c.store
transformed.qi=c.qi
transformed.path=c.path
transformed.url=c.url
transformed.redirect=c.redirect
transformed.set=c.set
transformed.error=c.error
c=transformed}`;
      else
        fnLiteral += `if(transformed instanceof ElysiaCustomStatusResponse)throw transformed
else Object.assign(c,transformed)
`;
      endUnit();
    }
    reporter.resolve();
  }
  if (validator) {
    if (validator.headers) {
      if (normalize2 && "Clean" in validator.headers && !hasAdditionalProperties(validator.headers))
        fnLiteral += "c.headers=validator.headers.Clean(c.headers);\n";
      if (hasProperty("default", validator.headers))
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.headers.schema,
            {}
          )
        )) {
          const parsed = typeof value === "object" ? JSON.stringify(value) : typeof value === "string" ? `'${value}'` : value;
          if (parsed !== void 0)
            fnLiteral += `c.headers['${key}']??=${parsed}
`;
        }
      if (isOptional(validator.headers))
        fnLiteral += `if(isNotEmpty(c.headers)){`;
      fnLiteral += `if(validator.headers.Check(c.headers) === false){` + composeValidation("headers") + "}";
      if (hasTransform(validator.headers.schema))
        fnLiteral += `c.headers=validator.headers.Decode(c.headers)
`;
      if (isOptional(validator.headers)) fnLiteral += "}";
    }
    if (validator.params) {
      if (hasProperty("default", validator.params))
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.params.schema,
            {}
          )
        )) {
          const parsed = typeof value === "object" ? JSON.stringify(value) : typeof value === "string" ? `'${value}'` : value;
          if (parsed !== void 0)
            fnLiteral += `c.params['${key}']??=${parsed}
`;
        }
      fnLiteral += `if(validator.params.Check(c.params)===false){` + composeValidation("params") + "}";
      if (hasTransform(validator.params.schema))
        fnLiteral += `c.params=validator.params.Decode(c.params)
`;
    }
    if (validator.query) {
      if (normalize2 && "Clean" in validator.query && !hasAdditionalProperties(validator.query))
        fnLiteral += "c.query=validator.query.Clean(c.query)\n";
      if (hasProperty("default", validator.query))
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            validator.query.schema,
            {}
          )
        )) {
          const parsed = typeof value === "object" ? JSON.stringify(value) : typeof value === "string" ? `'${value}'` : value;
          if (parsed !== void 0)
            fnLiteral += `if(c.query['${key}']===undefined)c.query['${key}']=${parsed}
`;
        }
      if (isOptional(validator.query))
        fnLiteral += `if(isNotEmpty(c.query)){`;
      fnLiteral += `if(validator.query.Check(c.query)===false){` + composeValidation("query") + `}`;
      if (hasTransform(validator.query.schema))
        fnLiteral += `c.query=validator.query.Decode(Object.assign({},c.query))
`;
      if (isOptional(validator.query)) fnLiteral += `}`;
    }
    if (validator.body) {
      if (normalize2 && "Clean" in validator.body && !hasAdditionalProperties(validator.body))
        fnLiteral += "c.body=validator.body.Clean(c.body)\n";
      const doesHaveTransform = hasTransform(validator.body.schema);
      if (doesHaveTransform || isOptional(validator.body))
        fnLiteral += `const isNotEmptyObject=c.body&&(typeof c.body==="object"&&isNotEmpty(c.body))
`;
      if (hasProperty("default", validator.body)) {
        const value = Default(
          // @ts-expect-error private property
          validator.body.schema,
          // @ts-expect-error private property
          validator.body.schema.type === "object" ? {} : void 0
        );
        const parsed = typeof value === "object" ? JSON.stringify(value) : typeof value === "string" ? `'${value}'` : value;
        fnLiteral += `if(validator.body.Check(c.body)===false){if(typeof c.body==='object')c.body=Object.assign(${parsed},c.body)
else c.body=${parsed}
`;
        if (isOptional(validator.body))
          fnLiteral += `if(isNotEmptyObject&&validator.body.Check(c.body)===false){` + composeValidation("body") + "}";
        else
          fnLiteral += `if(validator.body.Check(c.body)===false){` + composeValidation("body") + `}`;
        fnLiteral += "}";
      } else {
        if (isOptional(validator.body))
          fnLiteral += `if(isNotEmptyObject&&validator.body.Check(c.body)===false){` + composeValidation("body") + "}";
        else
          fnLiteral += `if(validator.body.Check(c.body)===false){` + composeValidation("body") + "}";
      }
      if (doesHaveTransform)
        fnLiteral += `if(isNotEmptyObject)c.body=validator.body.Decode(c.body)
`;
    }
    if (cookieValidator && isNotEmpty(
      // @ts-ignore
      ((_k = cookieValidator == null ? void 0 : cookieValidator.schema) == null ? void 0 : _k.properties) ?? // @ts-ignore
      ((_l = cookieValidator == null ? void 0 : cookieValidator.schema) == null ? void 0 : _l.schema) ?? {}
    )) {
      fnLiteral += `const cookieValue={}
for(const [key,value] of Object.entries(c.cookie))cookieValue[key]=value.value
`;
      if (hasProperty("default", cookieValidator))
        for (const [key, value] of Object.entries(
          Default(
            // @ts-ignore
            cookieValidator.schema,
            {}
          )
        )) {
          fnLiteral += `cookieValue['${key}'] = ${typeof value === "object" ? JSON.stringify(value) : value}
`;
        }
      if (isOptional(validator.cookie))
        fnLiteral += `if(isNotEmpty(c.cookie)){`;
      fnLiteral += `if(validator.cookie.Check(cookieValue)===false){` + composeValidation("cookie", "cookieValue") + "}";
      if (hasTransform(validator.cookie.schema))
        fnLiteral += `for(const [key,value] of Object.entries(validator.cookie.Decode(cookieValue)))c.cookie[key].value=value
`;
      if (isOptional(validator.cookie)) fnLiteral += `}`;
    }
  }
  if (hooks == null ? void 0 : hooks.beforeHandle) {
    const reporter = report("beforeHandle", {
      total: hooks.beforeHandle.length
    });
    let hasResolve = false;
    for (let i = 0; i < hooks.beforeHandle.length; i++) {
      const beforeHandle = hooks.beforeHandle[i];
      const endUnit = reporter.resolveChild(beforeHandle.fn.name);
      const returning = hasReturn(beforeHandle);
      const isResolver = beforeHandle.subType === "resolve" || beforeHandle.subType === "mapResolve";
      if (isResolver) {
        if (!hasResolve) {
          hasResolve = true;
          fnLiteral += "\nlet resolved\n";
        }
        fnLiteral += isAsync(beforeHandle) ? `resolved=await beforeHandle[${i}](c);
` : `resolved=beforeHandle[${i}](c);
`;
        if (beforeHandle.subType === "mapResolve")
          fnLiteral += `if(resolved instanceof ElysiaCustomStatusResponse)throw resolved
else{resolved.request = c.request
resolved.store = c.store
resolved.qi = c.qi
resolved.path = c.path
resolved.url = c.url
resolved.redirect = c.redirect
resolved.set = c.set
resolved.error = c.error
c = resolved}`;
        else
          fnLiteral += `if(resolved instanceof ElysiaCustomStatusResponse)throw resolved
else Object.assign(c, resolved)
`;
      } else if (!returning) {
        fnLiteral += isAsync(beforeHandle) ? `await beforeHandle[${i}](c)
` : `beforeHandle[${i}](c)
`;
        endUnit();
      } else {
        fnLiteral += isAsync(beforeHandle) ? `be=await beforeHandle[${i}](c)
` : `be=beforeHandle[${i}](c)
`;
        endUnit("be");
        fnLiteral += `if(be!==undefined){`;
        reporter.resolve();
        if ((_m = hooks.afterHandle) == null ? void 0 : _m.length) {
          report("handle", {
            name: isHandleFn ? handler.name : void 0
          }).resolve();
          const reporter2 = report("afterHandle", {
            total: hooks.afterHandle.length
          });
          for (let i2 = 0; i2 < hooks.afterHandle.length; i2++) {
            const hook = hooks.afterHandle[i2];
            const returning2 = hasReturn(hook);
            const endUnit2 = reporter2.resolveChild(hook.fn.name);
            fnLiteral += `c.response = be
`;
            if (!returning2) {
              fnLiteral += isAsync(hook.fn) ? `await afterHandle[${i2}](c, be)
` : `afterHandle[${i2}](c, be)
`;
            } else {
              fnLiteral += isAsync(hook.fn) ? `af = await afterHandle[${i2}](c)
` : `af = afterHandle[${i2}](c)
`;
              fnLiteral += `if(af!==undefined) c.response=be=af
`;
            }
            endUnit2("af");
          }
          reporter2.resolve();
        }
        if (validator.response)
          fnLiteral += composeResponseValidation("be");
        const mapResponseReporter = report("mapResponse", {
          total: hooks.mapResponse.length
        });
        if (hooks.mapResponse.length) {
          fnLiteral += `c.response=be
`;
          for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
            const mapResponse2 = hooks.mapResponse[i2];
            const endUnit2 = mapResponseReporter.resolveChild(
              mapResponse2.fn.name
            );
            fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse2) ? "await" : ""} onMapResponse[${i2}](c)
if(mr!==undefined)be=c.response=mr}`;
            endUnit2();
          }
        }
        mapResponseReporter.resolve();
        fnLiteral += encodeCookie;
        fnLiteral += `return mapEarlyResponse(${saveResponse}be,c.set${mapResponseContext})}
`;
      }
    }
    reporter.resolve();
  }
  if (hooks == null ? void 0 : hooks.afterHandle.length) {
    const handleReporter = report("handle", {
      name: isHandleFn ? handler.name : void 0
    });
    if (hooks.afterHandle.length)
      fnLiteral += isAsyncHandler ? `let r=c.response=await ${handle}
` : `let r=c.response=${handle}
`;
    else
      fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`;
    handleReporter.resolve();
    const reporter = report("afterHandle", {
      total: hooks.afterHandle.length
    });
    for (let i = 0; i < hooks.afterHandle.length; i++) {
      const hook = hooks.afterHandle[i];
      const returning = hasReturn(hook);
      const endUnit = reporter.resolveChild(hook.fn.name);
      if (!returning) {
        fnLiteral += isAsync(hook.fn) ? `await afterHandle[${i}](c)
` : `afterHandle[${i}](c)
`;
        endUnit();
      } else {
        fnLiteral += isAsync(hook.fn) ? `af=await afterHandle[${i}](c)
` : `af=afterHandle[${i}](c)
`;
        endUnit("af");
        if (validator.response) {
          fnLiteral += `if(af!==undefined){`;
          reporter.resolve();
          fnLiteral += composeResponseValidation("af");
          fnLiteral += `c.response=af}`;
        } else {
          fnLiteral += `if(af!==undefined){`;
          reporter.resolve();
          fnLiteral += `c.response=af}`;
        }
      }
    }
    reporter.resolve();
    fnLiteral += `r=c.response
`;
    if (validator.response) fnLiteral += composeResponseValidation();
    fnLiteral += encodeCookie;
    const mapResponseReporter = report("mapResponse", {
      total: hooks.mapResponse.length
    });
    if (hooks.mapResponse.length) {
      for (let i = 0; i < hooks.mapResponse.length; i++) {
        const mapResponse2 = hooks.mapResponse[i];
        const endUnit = mapResponseReporter.resolveChild(
          mapResponse2.fn.name
        );
        fnLiteral += `mr=${isAsyncName(mapResponse2) ? "await" : ""} onMapResponse[${i}](c)
if(mr!==undefined)r=c.response=mr
`;
        endUnit();
      }
    }
    mapResponseReporter.resolve();
    if (hasSet)
      fnLiteral += `return mapResponse(${saveResponse}r,c.set${mapResponseContext})
`;
    else
      fnLiteral += `return mapCompactResponse(${saveResponse}r${mapResponseContext})
`;
  } else {
    const handleReporter = report("handle", {
      name: isHandleFn ? handler.name : void 0
    });
    if (validator.response || hooks.mapResponse.length) {
      fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`;
      handleReporter.resolve();
      if (validator.response) fnLiteral += composeResponseValidation();
      report("afterHandle").resolve();
      const mapResponseReporter = report("mapResponse", {
        total: hooks.mapResponse.length
      });
      if (hooks.mapResponse.length) {
        fnLiteral += "\nc.response=r\n";
        for (let i = 0; i < hooks.mapResponse.length; i++) {
          const mapResponse2 = hooks.mapResponse[i];
          const endUnit = mapResponseReporter.resolveChild(
            mapResponse2.fn.name
          );
          fnLiteral += `
if(mr===undefined){mr=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i}](c)
if(mr!==undefined)r=c.response=mr}
`;
          endUnit();
        }
      }
      mapResponseReporter.resolve();
      fnLiteral += encodeCookie;
      if (handler instanceof Response) {
        fnLiteral += inference.set ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${saveResponse}${handle}.clone(),c.set${mapResponseContext})else return ${handle}.clone()` : `return ${handle}.clone()`;
        fnLiteral += "\n";
      } else if (hasSet)
        fnLiteral += `return mapResponse(${saveResponse}r,c.set${mapResponseContext})
`;
      else
        fnLiteral += `return mapCompactResponse(${saveResponse}r${mapResponseContext})
`;
    } else if (hasCookie || hasTrace) {
      fnLiteral += isAsyncHandler ? `let r=await ${handle}
` : `let r=${handle}
`;
      handleReporter.resolve();
      report("afterHandle").resolve();
      const mapResponseReporter = report("mapResponse", {
        total: hooks.mapResponse.length
      });
      if (hooks.mapResponse.length) {
        fnLiteral += "c.response= r\n";
        for (let i = 0; i < hooks.mapResponse.length; i++) {
          const mapResponse2 = hooks.mapResponse[i];
          const endUnit = mapResponseReporter.resolveChild(
            mapResponse2.fn.name
          );
          fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i}](c)
if(mr!==undefined)r=c.response=mr}`;
          endUnit();
        }
      }
      mapResponseReporter.resolve();
      fnLiteral += encodeCookie;
      if (hasSet)
        fnLiteral += `return mapResponse(${saveResponse}r,c.set${mapResponseContext})
`;
      else
        fnLiteral += `return mapCompactResponse(${saveResponse}r${mapResponseContext})
`;
    } else {
      handleReporter.resolve();
      const handled = isAsyncHandler ? `await ${handle}` : handle;
      report("afterHandle").resolve();
      if (handler instanceof Response) {
        fnLiteral += inference.set ? `if(isNotEmpty(c.set.headers)||c.set.status!==200||c.set.redirect||c.set.cookie)return mapResponse(${saveResponse}${handle}.clone(),c.set${mapResponseContext})
else return ${handle}.clone()
` : `return ${handle}.clone()
`;
      } else if (hasSet)
        fnLiteral += `return mapResponse(${saveResponse}${handled},c.set${mapResponseContext})
`;
      else
        fnLiteral += `return mapCompactResponse(${saveResponse}${handled}${mapResponseContext})
`;
    }
  }
  fnLiteral += `
}catch(error){`;
  if (hasBody) fnLiteral += `if(isParsing)error=new ParseError()
`;
  if (!maybeAsync) fnLiteral += `return(async()=>{`;
  fnLiteral += `const set=c.set
if(!set.status||set.status<300)set.status=error?.status||500
`;
  if (hasTrace)
    for (let i = 0; i < hooks.trace.length; i++)
      fnLiteral += `report${i}?.resolve(error);reportChild${i}?.(error)
`;
  const errorReporter = report("error", {
    total: hooks.error.length
  });
  if (hooks.error.length) {
    fnLiteral += `c.error=error
if(error instanceof TypeBoxError){c.code="VALIDATION"
c.set.status=422}else{c.code=error.code??error[ERROR_CODE]??"UNKNOWN"}let er
`;
    for (let i = 0; i < hooks.error.length; i++) {
      const endUnit = errorReporter.resolveChild(hooks.error[i].fn.name);
      if (isAsync(hooks.error[i]))
        fnLiteral += `er=await handleErrors[${i}](c)
`;
      else
        fnLiteral += `er=handleErrors[${i}](c)
if(er instanceof Promise)er=await er
`;
      endUnit();
      const mapResponseReporter = report("mapResponse", {
        total: hooks.mapResponse.length
      });
      if (hooks.mapResponse.length) {
        for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
          const mapResponse2 = hooks.mapResponse[i2];
          const endUnit2 = mapResponseReporter.resolveChild(
            mapResponse2.fn.name
          );
          fnLiteral += `c.response=er
er=onMapResponse[${i2}](c)
if(er instanceof Promise)er=await er
`;
          endUnit2();
        }
      }
      mapResponseReporter.resolve();
      fnLiteral += `er=mapEarlyResponse(er,set${mapResponseContext})
`;
      fnLiteral += `if(er){`;
      if (hasTrace) {
        for (let i2 = 0; i2 < hooks.trace.length; i2++)
          fnLiteral += `report${i2}.resolve()
`;
        errorReporter.resolve();
      }
      fnLiteral += `return er}`;
    }
  }
  errorReporter.resolve();
  fnLiteral += `return handleError(c,error,true)`;
  if (!maybeAsync) fnLiteral += "})()";
  fnLiteral += "}";
  if (hasAfterResponse || hasTrace) {
    fnLiteral += `finally{ `;
    if (!maybeAsync) fnLiteral += ";(async()=>{";
    const reporter = report("afterResponse", {
      total: hooks.afterResponse.length
    });
    if (hasAfterResponse) {
      for (let i = 0; i < hooks.afterResponse.length; i++) {
        const endUnit = reporter.resolveChild(
          hooks.afterResponse[i].fn.name
        );
        fnLiteral += `
await afterResponse[${i}](c)
`;
        endUnit();
      }
    }
    reporter.resolve();
    if (!maybeAsync) fnLiteral += "})()";
    fnLiteral += `}`;
  }
  const adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "";
  let init = `const {handler,handleError,hooks: {transform,resolve,beforeHandle,afterHandle,mapResponse: onMapResponse,parse,error: handleErrors,afterResponse,trace: _trace},validator,utils: {mapResponse,mapCompactResponse,mapEarlyResponse,parseQuery,parseQueryFromURL,isNotEmpty},error: {NotFoundError,ValidationError,InternalServerError,ParseError},schema,definitions,ERROR_CODE,parseCookie,signCookie,decodeURIComponent,ElysiaCustomStatusResponse,ELYSIA_TRACE,ELYSIA_REQUEST_ID,parser,getServer,` + adapterVariables + `TypeBoxError}=hooks
const trace=_trace.map(x=>typeof x==='function'?x:x.fn)
return ${maybeAsync ? "async " : ""}function handle(c){`;
  if (hooks.beforeHandle.length) init += "let be\n";
  if (hooks.afterHandle.length) init += "let af\n";
  if (hooks.mapResponse.length) init += "let mr\n";
  if (allowMeta) init += "c.schema = schema\nc.defs = definitions\n";
  init += fnLiteral + "}";
  try {
    if (asManifest) return Function("hooks", init);
    return Function(
      "hooks",
      init
    )({
      handler,
      hooks: lifeCycleToFn(hooks),
      validator,
      // @ts-expect-error
      handleError: app.handleError,
      utils: {
        mapResponse: adapterHandler.mapResponse,
        mapCompactResponse: adapterHandler.mapCompactResponse,
        mapEarlyResponse: adapterHandler.mapEarlyResponse,
        parseQuery,
        parseQueryFromURL,
        isNotEmpty
      },
      error: {
        NotFoundError,
        ValidationError,
        InternalServerError,
        ParseError
      },
      schema: app.router.history,
      // @ts-expect-error
      definitions: app.definitions.type,
      ERROR_CODE,
      parseCookie,
      signCookie,
      decodeURIComponent: decode,
      ElysiaCustomStatusResponse,
      ELYSIA_TRACE,
      ELYSIA_REQUEST_ID,
      // @ts-expect-error private property
      getServer: () => app.getServer(),
      TypeBoxError,
      parser: app["~parser"],
      ...adapter.inject
    });
  } catch (error2) {
    const debugHooks = lifeCycleToFn(hooks);
    console.log("[Composer] failed to generate optimized handler");
    console.log("---");
    console.log({
      handler: typeof handler === "function" ? handler.toString() : handler,
      instruction: init,
      hooks: {
        ...debugHooks,
        // @ts-expect-error
        transform: (_o = (_n = debugHooks == null ? void 0 : debugHooks.transform) == null ? void 0 : _n.map) == null ? void 0 : _o.call(_n, (x) => x.toString()),
        // @ts-expect-error
        resolve: (_q = (_p = debugHooks == null ? void 0 : debugHooks.resolve) == null ? void 0 : _p.map) == null ? void 0 : _q.call(_p, (x) => x.toString()),
        // @ts-expect-error
        beforeHandle: (_s = (_r = debugHooks == null ? void 0 : debugHooks.beforeHandle) == null ? void 0 : _r.map) == null ? void 0 : _s.call(
          _r,
          (x) => x.toString()
        ),
        // @ts-expect-error
        afterHandle: (_u = (_t = debugHooks == null ? void 0 : debugHooks.afterHandle) == null ? void 0 : _t.map) == null ? void 0 : _u.call(
          _t,
          (x) => x.toString()
        ),
        // @ts-expect-error
        mapResponse: (_w = (_v = debugHooks == null ? void 0 : debugHooks.mapResponse) == null ? void 0 : _v.map) == null ? void 0 : _w.call(
          _v,
          (x) => x.toString()
        ),
        // @ts-expect-error
        parse: (_y = (_x = debugHooks == null ? void 0 : debugHooks.parse) == null ? void 0 : _x.map) == null ? void 0 : _y.call(_x, (x) => x.toString()),
        // @ts-expect-error
        error: (_A = (_z = debugHooks == null ? void 0 : debugHooks.error) == null ? void 0 : _z.map) == null ? void 0 : _A.call(_z, (x) => x.toString()),
        // @ts-expect-error
        afterResponse: (_C = (_B = debugHooks == null ? void 0 : debugHooks.afterResponse) == null ? void 0 : _B.map) == null ? void 0 : _C.call(
          _B,
          (x) => x.toString()
        ),
        // @ts-expect-error
        stop: (_E = (_D = debugHooks == null ? void 0 : debugHooks.stop) == null ? void 0 : _D.map) == null ? void 0 : _E.call(_D, (x) => x.toString())
      },
      validator,
      // @ts-expect-error
      definitions: app.definitions.type,
      error: error2,
      fnLiteral
    });
    console.log("---");
    process.exit(1);
  }
};
const composeGeneralHandler = (app, { asManifest = false } = {}) => {
  const adapter = app["~adapter"].composeGeneralHandler;
  const error404 = adapter.error404(
    !!app.event.request.length,
    !!app.event.error.length
  );
  let fnLiteral = "";
  const router = app.router;
  let findDynamicRoute = `const route=router.find(r.method,p)`;
  findDynamicRoute += router.http.root.ALL ? '??router.find("ALL",p)\n' : "\n";
  findDynamicRoute += error404.code;
  findDynamicRoute += `
c.params=route.params
if(route.store.handler)return route.store.handler(c)
return (route.store.handler=route.store.compile())(c)
`;
  let switchMap = ``;
  for (const [path, { code, all }] of Object.entries(
    router.static.http.map
  )) {
    switchMap += `case'${path}':`;
    if (app.config.strictPath !== true)
      switchMap += `case'${getLoosePath(path)}':`;
    switchMap += `switch(r.method){${code}
` + (all ?? `default: break map`) + "}";
  }
  const maybeAsync = app.event.request.some(isAsync);
  const adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "";
  fnLiteral += `
const {app,mapEarlyResponse,NotFoundError,randomId,handleError,error,redirect,ELYSIA_TRACE,ELYSIA_REQUEST_ID,` + adapterVariables + `getServer}=data
const store=app.singleton.store
const decorator=app.singleton.decorator
const staticRouter=app.router.static.http
const ht=app.router.history
const wsRouter=app.router.ws
const router=app.router.http
const trace=app.event.trace.map(x=>typeof x==='function'?x:x.fn)
const notFound=new NotFoundError()
const hoc=app.extender.higherOrderFunctions.map(x=>x.fn)
`;
  if (app.event.request.length)
    fnLiteral += `const onRequest=app.event.request.map(x=>x.fn)
`;
  fnLiteral += error404.declare;
  if (app.event.trace.length)
    fnLiteral += `const ` + app.event.trace.map((_, i) => `tr${i}=app.event.trace[${i}].fn`).join(",") + "\n";
  fnLiteral += `${maybeAsync ? "async " : ""}function map(${adapter.parameters}){`;
  if (app.event.request.length) fnLiteral += `let re
`;
  fnLiteral += adapter.createContext(app);
  if (app.event.trace.length)
    fnLiteral += `c[ELYSIA_TRACE]=[` + app.event.trace.map((_, i) => `tr${i}(c)`).join(",") + `]
`;
  const report = createReport({
    trace: app.event.trace,
    addFn(word) {
      fnLiteral += word;
    }
  });
  const reporter = report("request", {
    total: app.event.request.length
  });
  if (app.event.request.length) {
    fnLiteral += `try{`;
    for (let i = 0; i < app.event.request.length; i++) {
      const hook = app.event.request[i];
      const withReturn = hasReturn(hook);
      const maybeAsync2 = isAsync(hook);
      const endUnit = reporter.resolveChild(app.event.request[i].fn.name);
      if (withReturn) {
        fnLiteral += `re=mapEarlyResponse(${maybeAsync2 ? "await " : ""}onRequest[${i}](c),c.set)
`;
        endUnit("re");
        fnLiteral += `if(re!==undefined)return re
`;
      } else {
        fnLiteral += `${maybeAsync2 ? "await " : ""}onRequest[${i}](c)
`;
        endUnit();
      }
    }
    fnLiteral += `}catch(error){return app.handleError(c,error,false)}`;
  }
  reporter.resolve();
  fnLiteral += adapter.websocket(app);
  fnLiteral += `
map:switch(p){
` + switchMap + `default:break}` + findDynamicRoute + `}
`;
  if (app.extender.higherOrderFunctions.length) {
    let handler = "map";
    for (let i = 0; i < app.extender.higherOrderFunctions.length; i++)
      handler = `hoc[${i}](${handler},${adapter.parameters})`;
    fnLiteral += `return function hocMap(${adapter.parameters}){return ${handler}(${adapter.parameters})}`;
  } else fnLiteral += `return map`;
  const handleError = composeErrorHandler(app);
  app.handleError = handleError;
  return Function(
    "data",
    fnLiteral
  )({
    app,
    mapEarlyResponse: app["~adapter"]["handler"].mapEarlyResponse,
    NotFoundError,
    randomId,
    handleError,
    error,
    redirect,
    ELYSIA_TRACE,
    ELYSIA_REQUEST_ID,
    // @ts-expect-error private property
    getServer: () => app.getServer(),
    ...adapter.inject
  });
};
const composeErrorHandler = (app) => {
  const hooks = app.event;
  let fnLiteral = "";
  const adapter = app["~adapter"].composeError;
  const adapterVariables = adapter.inject ? Object.keys(adapter.inject).join(",") + "," : "";
  fnLiteral += `const {app:{event:{error:onErrorContainer,afterResponse:resContainer,mapResponse:_onMapResponse,trace:_trace}},mapResponse,ERROR_CODE,ElysiaCustomStatusResponse,ELYSIA_TRACE,` + adapterVariables + `ELYSIA_REQUEST_ID}=inject
`;
  fnLiteral += `const trace=_trace.map(x=>typeof x==='function'?x:x.fn)
const onMapResponse=[]
for(let i=0;i<_onMapResponse.length;i++)onMapResponse.push(_onMapResponse[i].fn??_onMapResponse[i])
delete _onMapResponse
const onError=onErrorContainer.map(x=>x.fn)
const res=resContainer.map(x=>x.fn)
return ${app.event.error.find(isAsync) || app.event.mapResponse.find(isAsync) ? "async " : ""}function(context,error,skipGlobal){`;
  const hasTrace = app.event.trace.length > 0;
  fnLiteral += "";
  if (hasTrace) fnLiteral += "const id=context[ELYSIA_REQUEST_ID]\n";
  const report = createReport({
    context: "context",
    trace: hooks.trace,
    addFn: (word) => {
      fnLiteral += word;
    }
  });
  fnLiteral += `const set=context.set
let _r
if(!context.code)context.code=error.code??error[ERROR_CODE]
if(!(context.error instanceof Error))context.error=error
if(error instanceof ElysiaCustomStatusResponse){set.status=error.status=error.code
error.message=error.response}`;
  if (adapter.declare) fnLiteral += adapter.declare;
  const saveResponse = hasTrace || hooks.afterResponse.length > 0 || hooks.afterResponse.length > 0 ? "context.response = " : "";
  for (let i = 0; i < app.event.error.length; i++) {
    const handler = app.event.error[i];
    const response = `${isAsync(handler) ? "await " : ""}onError[${i}](context)
`;
    fnLiteral += "if(skipGlobal!==true){";
    if (hasReturn(handler)) {
      fnLiteral += `_r=${response}
if(_r!==undefined){if(_r instanceof Response)return mapResponse(_r,set${adapter.mapResponseContext})
if(_r instanceof ElysiaCustomStatusResponse){error.status=error.code
error.message = error.response}if(set.status===200||!set.status)set.status=error.status
`;
      const mapResponseReporter2 = report("mapResponse", {
        total: hooks.mapResponse.length,
        name: "context"
      });
      if (hooks.mapResponse.length) {
        for (let i2 = 0; i2 < hooks.mapResponse.length; i2++) {
          const mapResponse2 = hooks.mapResponse[i2];
          const endUnit = mapResponseReporter2.resolveChild(
            mapResponse2.fn.name
          );
          fnLiteral += `context.response=_r_r=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i2}](context)
`;
          endUnit();
        }
      }
      mapResponseReporter2.resolve();
      fnLiteral += `return mapResponse(${saveResponse}_r,set${adapter.mapResponseContext})}`;
    } else fnLiteral += response;
    fnLiteral += "}";
  }
  fnLiteral += `if(error.constructor.name==="ValidationError"||error.constructor.name==="TransformDecodeError"){if(error.error)error=error.error
set.status=error.status??422
` + adapter.validationError + `}`;
  fnLiteral += `if(error instanceof Error){` + adapter.unknownError + `}`;
  const mapResponseReporter = report("mapResponse", {
    total: hooks.mapResponse.length,
    name: "context"
  });
  fnLiteral += "\nif(!context.response)context.response=error.message??error\n";
  if (hooks.mapResponse.length) {
    fnLiteral += "let mr\n";
    for (let i = 0; i < hooks.mapResponse.length; i++) {
      const mapResponse2 = hooks.mapResponse[i];
      const endUnit = mapResponseReporter.resolveChild(
        mapResponse2.fn.name
      );
      fnLiteral += `if(mr===undefined){mr=${isAsyncName(mapResponse2) ? "await " : ""}onMapResponse[${i}](context)
if(mr!==undefined)error=context.response=mr}`;
      endUnit();
    }
  }
  mapResponseReporter.resolve();
  fnLiteral += `
return mapResponse(${saveResponse}error,set${adapter.mapResponseContext})}`;
  return Function(
    "inject",
    fnLiteral
  )({
    app,
    mapResponse: app["~adapter"].handler.mapResponse,
    ERROR_CODE,
    ElysiaCustomStatusResponse,
    ELYSIA_TRACE,
    ELYSIA_REQUEST_ID,
    ...adapter.inject
  });
};
const injectDefaultValues = (typeChecker, obj) => {
  for (const [key, keySchema] of Object.entries(
    // @ts-expect-error private
    typeChecker.schema.properties
  )) {
    obj[key] ?? (obj[key] = keySchema.default);
  }
};
const createDynamicHandler = (app) => {
  const { mapResponse: mapResponse2, mapEarlyResponse: mapEarlyResponse2 } = app["~adapter"].handler;
  return async (request) => {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
    const url = request.url, s = url.indexOf("/", 11), qi = url.indexOf("?", s + 1), path = qi === -1 ? url.substring(s) : url.substring(s, qi);
    const set2 = {
      cookie: {},
      status: 200,
      headers: {}
    };
    const context = Object.assign(
      {},
      // @ts-expect-error
      app.singleton.decorator,
      {
        set: set2,
        // @ts-expect-error
        store: app.singleton.store,
        request,
        path,
        qi,
        redirect
      }
    );
    try {
      for (let i = 0; i < app.event.request.length; i++) {
        const onRequest = app.event.request[i].fn;
        let response2 = onRequest(context);
        if (response2 instanceof Promise) response2 = await response2;
        response2 = mapEarlyResponse2(response2, set2);
        if (response2) return context.response = response2;
      }
      const handler = app.router.dynamic.find(request.method, path) ?? app.router.dynamic.find("ALL", path);
      if (!handler) throw new NotFoundError();
      const { handle, hooks, validator, content } = handler.store;
      let body;
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (content) {
          switch (content) {
            case "application/json":
              body = await request.json();
              break;
            case "text/plain":
              body = await request.text();
              break;
            case "application/x-www-form-urlencoded":
              body = parseQuery(await request.text());
              break;
            case "application/octet-stream":
              body = await request.arrayBuffer();
              break;
            case "multipart/form-data":
              body = {};
              const form = await request.formData();
              for (const key of form.keys()) {
                if (body[key]) continue;
                const value = form.getAll(key);
                if (value.length === 1) body[key] = value[0];
                else body[key] = value;
              }
              break;
          }
        } else {
          let contentType = request.headers.get("content-type");
          if (contentType) {
            const index = contentType.indexOf(";");
            if (index !== -1)
              contentType = contentType.slice(0, index);
            context.contentType = contentType;
            for (let i = 0; i < hooks.parse.length; i++) {
              const hook = hooks.parse[i].fn;
              let temp = hook(context, contentType);
              if (temp instanceof Promise) temp = await temp;
              if (temp) {
                body = temp;
                break;
              }
            }
            delete context.contentType;
            if (body === void 0) {
              switch (contentType) {
                case "application/json":
                  body = await request.json();
                  break;
                case "text/plain":
                  body = await request.text();
                  break;
                case "application/x-www-form-urlencoded":
                  body = parseQuery(await request.text());
                  break;
                case "application/octet-stream":
                  body = await request.arrayBuffer();
                  break;
                case "multipart/form-data":
                  body = {};
                  const form = await request.formData();
                  for (const key of form.keys()) {
                    if (body[key]) continue;
                    const value = form.getAll(key);
                    if (value.length === 1)
                      body[key] = value[0];
                    else body[key] = value;
                  }
                  break;
              }
            }
          }
        }
      }
      context.body = body;
      context.params = (handler == null ? void 0 : handler.params) || void 0;
      context.query = qi === -1 ? {} : parseQuery(url.substring(qi + 1));
      context.headers = {};
      for (const [key, value] of request.headers.entries())
        context.headers[key] = value;
      const cookieMeta = Object.assign(
        {},
        (_a2 = app.config) == null ? void 0 : _a2.cookie,
        // @ts-expect-error
        (_b = validator == null ? void 0 : validator.cookie) == null ? void 0 : _b.config
      );
      const cookieHeaderValue = request.headers.get("cookie");
      context.cookie = await parseCookie(
        context.set,
        cookieHeaderValue,
        cookieMeta ? {
          secrets: cookieMeta.secrets !== void 0 ? typeof cookieMeta.secrets === "string" ? cookieMeta.secrets : cookieMeta.secrets.join(",") : void 0,
          sign: cookieMeta.sign === true ? true : cookieMeta.sign !== void 0 ? typeof cookieMeta.sign === "string" ? cookieMeta.sign : cookieMeta.sign.join(",") : void 0
        } : void 0
      );
      const headerValidator = (_c = validator == null ? void 0 : validator.createHeaders) == null ? void 0 : _c.call(validator);
      if (headerValidator)
        injectDefaultValues(headerValidator, context.headers);
      const paramsValidator = (_d = validator == null ? void 0 : validator.createParams) == null ? void 0 : _d.call(validator);
      if (paramsValidator)
        injectDefaultValues(paramsValidator, context.params);
      const queryValidator = (_e = validator == null ? void 0 : validator.createQuery) == null ? void 0 : _e.call(validator);
      if (queryValidator)
        injectDefaultValues(queryValidator, context.query);
      for (let i = 0; i < hooks.transform.length; i++) {
        const hook = hooks.transform[i];
        const operation = hook.fn(context);
        if (hook.subType === "derive") {
          if (operation instanceof Promise)
            Object.assign(context, await operation);
          else Object.assign(context, operation);
        } else if (operation instanceof Promise) await operation;
      }
      if (validator) {
        if (headerValidator) {
          const _header = structuredClone(context.headers);
          for (const [key, value] of request.headers)
            _header[key] = value;
          if (validator.headers.Check(_header) === false)
            throw new ValidationError(
              "header",
              validator.headers,
              _header
            );
        } else if ((_f = validator.headers) == null ? void 0 : _f.Decode)
          context.headers = validator.headers.Decode(context.headers);
        if ((paramsValidator == null ? void 0 : paramsValidator.Check(context.params)) === false) {
          throw new ValidationError(
            "params",
            validator.params,
            context.params
          );
        } else if ((_g = validator.params) == null ? void 0 : _g.Decode)
          context.params = validator.params.Decode(context.params);
        if ((queryValidator == null ? void 0 : queryValidator.Check(context.query)) === false)
          throw new ValidationError(
            "query",
            validator.query,
            context.query
          );
        else if ((_h = validator.query) == null ? void 0 : _h.Decode)
          context.query = validator.query.Decode(context.query);
        if ((_i = validator.createCookie) == null ? void 0 : _i.call(validator)) {
          let cookieValue = {};
          for (const [key, value] of Object.entries(context.cookie))
            cookieValue[key] = value.value;
          if (validator.cookie.Check(cookieValue) === false)
            throw new ValidationError(
              "cookie",
              validator.cookie,
              cookieValue
            );
          else if ((_j = validator.cookie) == null ? void 0 : _j.Decode)
            cookieValue = validator.cookie.Decode(
              cookieValue
            );
        }
        if (((_l = (_k = validator.createBody) == null ? void 0 : _k.call(validator)) == null ? void 0 : _l.Check(body)) === false)
          throw new ValidationError("body", validator.body, body);
        else if ((_m = validator.body) == null ? void 0 : _m.Decode)
          context.body = validator.body.Decode(body);
      }
      for (let i = 0; i < hooks.beforeHandle.length; i++) {
        const hook = hooks.beforeHandle[i];
        let response2 = hook.fn(context);
        if (hook.subType === "resolve") {
          if (response2 instanceof ElysiaCustomStatusResponse) {
            const result = mapEarlyResponse2(response2, context.set);
            if (result)
              return context.response = result;
          }
          if (response2 instanceof Promise)
            Object.assign(context, await response2);
          else Object.assign(context, response2);
          continue;
        } else if (response2 instanceof Promise)
          response2 = await response2;
        if (response2 !== void 0) {
          ;
          context.response = response2;
          for (let i2 = 0; i2 < hooks.afterHandle.length; i2++) {
            let newResponse = hooks.afterHandle[i2].fn(
              context
            );
            if (newResponse instanceof Promise)
              newResponse = await newResponse;
            if (newResponse) response2 = newResponse;
          }
          const result = mapEarlyResponse2(response2, context.set);
          if (result) return context.response = result;
        }
      }
      let response = typeof handle === "function" ? handle(context) : handle;
      if (response instanceof Promise) response = await response;
      if (!hooks.afterHandle.length) {
        const status = response instanceof ElysiaCustomStatusResponse ? response.code : set2.status ? typeof set2.status === "string" ? StatusMap[set2.status] : set2.status : 200;
        const responseValidator = (_o = (_n = validator == null ? void 0 : validator.createResponse) == null ? void 0 : _n.call(validator)) == null ? void 0 : _o[status];
        if ((responseValidator == null ? void 0 : responseValidator.Check(response)) === false)
          throw new ValidationError(
            "response",
            responseValidator,
            response
          );
        else if (responseValidator == null ? void 0 : responseValidator.Decode)
          response = responseValidator.Decode(response);
      } else {
        ;
        context.response = response;
        for (let i = 0; i < hooks.afterHandle.length; i++) {
          let newResponse = hooks.afterHandle[i].fn(
            context
          );
          if (newResponse instanceof Promise)
            newResponse = await newResponse;
          const result = mapEarlyResponse2(newResponse, context.set);
          if (result !== void 0) {
            const responseValidator = (
              // @ts-expect-error
              (_p = validator == null ? void 0 : validator.response) == null ? void 0 : _p[result.status]
            );
            if ((responseValidator == null ? void 0 : responseValidator.Check(result)) === false)
              throw new ValidationError(
                "response",
                responseValidator,
                result
              );
            else if (responseValidator == null ? void 0 : responseValidator.Decode)
              response = responseValidator.Decode(response);
            return context.response = result;
          }
        }
      }
      if (context.set.cookie && (cookieMeta == null ? void 0 : cookieMeta.sign)) {
        const secret = !cookieMeta.secrets ? void 0 : typeof cookieMeta.secrets === "string" ? cookieMeta.secrets : cookieMeta.secrets[0];
        if (cookieMeta.sign === true)
          for (const [key, cookie] of Object.entries(
            context.set.cookie
          ))
            context.set.cookie[key].value = await signCookie(
              cookie.value,
              "${secret}"
            );
        else {
          const properties = (_r = (_q = validator == null ? void 0 : validator.cookie) == null ? void 0 : _q.schema) == null ? void 0 : _r.properties;
          for (const name of cookieMeta.sign) {
            if (!(name in properties)) continue;
            if ((_s = context.set.cookie[name]) == null ? void 0 : _s.value) {
              context.set.cookie[name].value = await signCookie(
                context.set.cookie[name].value,
                secret
              );
            }
          }
        }
      }
      return mapResponse2(context.response = response, context.set);
    } catch (error2) {
      const reportedError = error2 instanceof TransformDecodeError && error2.error ? error2.error : error2;
      return app.handleError(context, reportedError);
    } finally {
      for (const afterResponse of app.event.afterResponse)
        await afterResponse.fn(context);
    }
  };
};
const createDynamicErrorHandler = (app) => {
  const { mapResponse: mapResponse2 } = app["~adapter"].handler;
  return async (context, error2) => {
    const errorContext = Object.assign(context, { error: error2, code: error2.code });
    errorContext.set = context.set;
    for (let i = 0; i < app.event.error.length; i++) {
      const hook = app.event.error[i];
      let response = hook.fn(errorContext);
      if (response instanceof Promise) response = await response;
      if (response !== void 0 && response !== null)
        return context.response = mapResponse2(response, context.set);
    }
    return new Response(
      typeof error2.cause === "string" ? error2.cause : error2.message,
      {
        headers: context.set.headers,
        status: error2.status ?? 500
      }
    );
  };
};
class Elysia {
  constructor(config = {}) {
    this.server = null;
    this.dependencies = {};
    this._routes = {};
    this._types = {
      Prefix: "",
      Singleton: {},
      Definitions: {},
      Metadata: {}
    };
    this._ephemeral = {};
    this._volatile = {};
    this.singleton = {
      decorator: {},
      store: {},
      derive: {},
      resolve: {}
    };
    this.definitions = {
      typebox: t.Module({}),
      type: {},
      error: {}
    };
    this.extender = {
      macros: [],
      higherOrderFunctions: []
    };
    this.validator = {
      global: null,
      scoped: null,
      local: null,
      getCandidate() {
        return mergeSchemaValidator(
          mergeSchemaValidator(this.global, this.scoped),
          this.local
        );
      }
    };
    this.event = {
      start: [],
      request: [],
      parse: [],
      transform: [],
      beforeHandle: [],
      afterHandle: [],
      mapResponse: [],
      afterResponse: [],
      trace: [],
      error: [],
      stop: []
    };
    this.telemetry = {
      stack: void 0
    };
    this.router = {
      http: new Memoirist(),
      ws: new Memoirist(),
      // Use in non-AOT mode
      dynamic: new Memoirist(),
      static: {
        http: {
          static: {},
          // handlers: [] as ComposedHandler[],
          map: {},
          all: ""
        },
        // Static WS Router is consists of pathname and websocket handler index to compose
        ws: {}
      },
      history: []
    };
    this.routeTree = /* @__PURE__ */ new Map();
    this.inference = {
      body: false,
      cookie: false,
      headers: false,
      query: false,
      set: false,
      server: false,
      request: false,
      route: false
    };
    this["~parser"] = {};
    this.handle = async (request) => this.fetch(request);
    this.fetch = (request) => {
      return (this.fetch = this.config.aot ? composeGeneralHandler(this) : createDynamicHandler(this))(request);
    };
    this.handleError = async (context, error2) => {
      return (this.handleError = this.config.aot ? composeErrorHandler(this) : createDynamicErrorHandler(this))(context, error2);
    };
    this.outerErrorHandler = (error2) => new Response(error2.message || error2.name || "Error", {
      // @ts-ignore
      status: (error2 == null ? void 0 : error2.status) ?? 500
    });
    this.listen = (options, callback) => {
      this["~adapter"].listen(this)(options, callback);
      return this;
    };
    this.stop = async (closeActiveConnections) => {
      if (!this.server)
        throw new Error(
          "Elysia isn't running. Call `app.listen` to start the server."
        );
      if (this.server) {
        this.server.stop(closeActiveConnections);
        this.server = null;
        if (this.event.stop.length)
          for (let i = 0; i < this.event.stop.length; i++)
            this.event.stop[i].fn(this);
      }
    };
    if (config.tags) {
      if (!config.detail)
        config.detail = {
          tags: config.tags
        };
      else config.detail.tags = config.tags;
    }
    if (config.nativeStaticResponse === void 0)
      config.nativeStaticResponse = true;
    this.config = {};
    this.applyConfig(config ?? {});
    this["~adapter"] = config.adapter ?? (typeof Bun !== "undefined" ? BunAdapter : WebStandardAdapter);
    if ((config == null ? void 0 : config.analytic) && ((config == null ? void 0 : config.name) || (config == null ? void 0 : config.seed) !== void 0))
      this.telemetry.stack = new Error().stack;
  }
  get store() {
    return this.singleton.store;
  }
  get decorator() {
    return this.singleton.decorator;
  }
  get routes() {
    return this.router.history;
  }
  getGlobalRoutes() {
    return this.router.history;
  }
  getServer() {
    return this.server;
  }
  get promisedModules() {
    if (!this._promisedModules) this._promisedModules = new PromiseGroup();
    return this._promisedModules;
  }
  env(model, _env = env) {
    const validator = getSchemaValidator(model, {
      modules: this.definitions.typebox,
      dynamic: true,
      additionalProperties: true,
      coerce: true
    });
    if (validator.Check(_env) === false) {
      const error2 = new ValidationError("env", model, _env);
      throw new Error(error2.all.map((x) => x.summary).join("\n"));
    }
    return this;
  }
  /**
   * @private DO_NOT_USE_OR_YOU_WILL_BE_FIRED
   * @version 1.1.0
   *
   * ! Do not use unless you now exactly what you are doing
   * ? Add Higher order function to Elysia.fetch
   */
  wrap(fn) {
    this.extender.higherOrderFunctions.push({
      checksum: checksum(
        JSON.stringify({
          name: this.config.name,
          seed: this.config.seed,
          content: fn.toString()
        })
      ),
      fn
    });
    return this;
  }
  applyMacro(localHook) {
    if (this.extender.macros.length) {
      const manage = createMacroManager({
        globalHook: this.event,
        localHook
      });
      const manager = {
        events: {
          global: this.event,
          local: localHook
        },
        get onParse() {
          return manage("parse");
        },
        get onTransform() {
          return manage("transform");
        },
        get onBeforeHandle() {
          return manage("beforeHandle");
        },
        get onAfterHandle() {
          return manage("afterHandle");
        },
        get mapResponse() {
          return manage("mapResponse");
        },
        get onAfterResponse() {
          return manage("afterResponse");
        },
        get onError() {
          return manage("error");
        }
      };
      for (const macro of this.extender.macros)
        traceBackMacro(macro.fn(manager), localHook, manage);
    }
  }
  applyConfig(config) {
    this.config = {
      prefix: "",
      aot: env.ELYSIA_AOT !== "false",
      normalize: true,
      ...config,
      cookie: {
        path: "/",
        ...config == null ? void 0 : config.cookie
      },
      experimental: (config == null ? void 0 : config.experimental) ?? {},
      seed: (config == null ? void 0 : config.seed) === void 0 ? "" : config == null ? void 0 : config.seed
    };
    return this;
  }
  get models() {
    const models = {};
    for (const name of Object.keys(this.definitions.type))
      models[name] = getSchemaValidator(
        // @ts-expect-error
        this.definitions.typebox.Import(name)
      );
    models.modules = this.definitions.typebox;
    return models;
  }
  add(method, path, handle, localHook, { allowMeta = false, skipPrefix = false } = {
    allowMeta: false,
    skipPrefix: false
  }) {
    var _a2;
    localHook = localHookToLifeCycleStore(localHook);
    if (path !== "" && path.charCodeAt(0) !== 47) path = "/" + path;
    if (this.config.prefix && !skipPrefix) path = this.config.prefix + path;
    if (localHook == null ? void 0 : localHook.type)
      switch (localHook.type) {
        case "text":
          localHook.type = "text/plain";
          break;
        case "json":
          localHook.type = "application/json";
          break;
        case "formdata":
          localHook.type = "multipart/form-data";
          break;
        case "urlencoded":
          localHook.type = "application/x-www-form-urlencoded";
          break;
        case "arrayBuffer":
          localHook.type = "application/octet-stream";
          break;
      }
    const models = this.definitions.type;
    const dynamic = !this.config.aot;
    const instanceValidator = { ...this.validator.getCandidate() };
    const cloned = {
      body: (localHook == null ? void 0 : localHook.body) ?? (instanceValidator == null ? void 0 : instanceValidator.body),
      headers: (localHook == null ? void 0 : localHook.headers) ?? (instanceValidator == null ? void 0 : instanceValidator.headers),
      params: (localHook == null ? void 0 : localHook.params) ?? (instanceValidator == null ? void 0 : instanceValidator.params),
      query: (localHook == null ? void 0 : localHook.query) ?? (instanceValidator == null ? void 0 : instanceValidator.query),
      cookie: (localHook == null ? void 0 : localHook.cookie) ?? (instanceValidator == null ? void 0 : instanceValidator.cookie),
      response: (localHook == null ? void 0 : localHook.response) ?? (instanceValidator == null ? void 0 : instanceValidator.response)
    };
    const cookieValidator = () => {
      var _a3;
      return cloned.cookie ? getCookieValidator({
        modules,
        validator: cloned.cookie,
        defaultConfig: this.config.cookie,
        config: ((_a3 = cloned.cookie) == null ? void 0 : _a3.config) ?? {},
        dynamic,
        models
      }) : void 0;
    };
    const normalize2 = this.config.normalize;
    const modules = this.definitions.typebox;
    const validator = this.config.precompile === true || typeof this.config.precompile === "object" && this.config.precompile.schema === true ? {
      body: getSchemaValidator(cloned.body, {
        modules,
        dynamic,
        models,
        normalize: normalize2,
        additionalCoerce: coercePrimitiveRoot()
      }),
      headers: getSchemaValidator(cloned.headers, {
        modules,
        dynamic,
        models,
        additionalProperties: !this.config.normalize,
        coerce: true,
        additionalCoerce: stringToStructureCoercions()
      }),
      params: getSchemaValidator(cloned.params, {
        modules,
        dynamic,
        models,
        coerce: true,
        additionalCoerce: stringToStructureCoercions()
      }),
      query: getSchemaValidator(cloned.query, {
        modules,
        dynamic,
        models,
        normalize: normalize2,
        coerce: true,
        additionalCoerce: stringToStructureCoercions()
      }),
      cookie: cookieValidator(),
      response: getResponseSchemaValidator(cloned.response, {
        modules,
        dynamic,
        models,
        normalize: normalize2
      })
    } : {
      createBody() {
        if (this.body) return this.body;
        return this.body = getSchemaValidator(
          cloned.body,
          {
            modules,
            dynamic,
            models,
            normalize: normalize2,
            additionalCoerce: coercePrimitiveRoot()
          }
        );
      },
      createHeaders() {
        if (this.headers) return this.headers;
        return this.headers = getSchemaValidator(
          cloned.headers,
          {
            modules,
            dynamic,
            models,
            additionalProperties: !normalize2,
            coerce: true,
            additionalCoerce: stringToStructureCoercions()
          }
        );
      },
      createParams() {
        if (this.params) return this.params;
        return this.params = getSchemaValidator(
          cloned.params,
          {
            modules,
            dynamic,
            models,
            coerce: true,
            additionalCoerce: stringToStructureCoercions()
          }
        );
      },
      createQuery() {
        if (this.query) return this.query;
        return this.query = getSchemaValidator(
          cloned.query,
          {
            modules,
            dynamic,
            models,
            coerce: true,
            additionalCoerce: stringToStructureCoercions()
          }
        );
      },
      createCookie() {
        if (this.cookie) return this.cookie;
        return this.cookie = cookieValidator();
      },
      createResponse() {
        if (this.response) return this.response;
        return this.response = getResponseSchemaValidator(
          cloned.response,
          {
            modules,
            dynamic,
            models,
            normalize: normalize2
          }
        );
      }
    };
    localHook = mergeHook(localHook, instanceValidator);
    if (localHook.tags) {
      if (!localHook.detail)
        localHook.detail = {
          tags: localHook.tags
        };
      else localHook.detail.tags = localHook.tags;
    }
    if (isNotEmpty(this.config.detail))
      localHook.detail = mergeDeep(
        Object.assign({}, this.config.detail),
        localHook.detail
      );
    this.applyMacro(localHook);
    const hooks = mergeHook(this.event, localHook);
    if (this.config.aot === false) {
      this.router.dynamic.add(method, path, {
        validator,
        hooks,
        content: localHook == null ? void 0 : localHook.type,
        handle
      });
      if (this.config.strictPath === false)
        this.router.dynamic.add(method, getLoosePath(path), {
          validator,
          hooks,
          content: localHook == null ? void 0 : localHook.type,
          handle
        });
      this.router.history.push({
        method,
        path,
        composed: null,
        handler: handle,
        hooks,
        compile: handle
      });
      return;
    }
    const shouldPrecompile = this.config.precompile === true || typeof this.config.precompile === "object" && this.config.precompile.compose === true;
    const inference = cloneInference(this.inference);
    const adapter = this["~adapter"].handler;
    const staticHandler = typeof handle !== "function" && typeof adapter.createStaticHandler === "function" ? adapter.createStaticHandler(handle, hooks, this.setHeaders) : void 0;
    const nativeStaticHandler = typeof handle !== "function" ? (_a2 = adapter.createNativeStaticHandler) == null ? void 0 : _a2.call(
      adapter,
      handle,
      hooks,
      this.setHeaders
    ) : void 0;
    if (this.config.nativeStaticResponse === true && nativeStaticHandler && (method === "GET" || method === "ALL"))
      this.router.static.http.static[path] = nativeStaticHandler();
    const compile = (asManifest = false) => composeHandler({
      app: this,
      path,
      method,
      localHook: mergeHook(localHook),
      hooks,
      validator,
      handler: typeof handle !== "function" && typeof adapter.createStaticHandler !== "function" ? () => handle : handle,
      allowMeta,
      inference,
      asManifest
    });
    if (this.routeTree.has(method + path))
      for (let i = 0; i < this.router.history.length; i++) {
        const route = this.router.history[i];
        if (route.path === path && route.method === method) {
          const removed = this.router.history.splice(i, 1)[0];
          if (removed && this.routeTree.has((removed == null ? void 0 : removed.method) + (removed == null ? void 0 : removed.path)))
            this.routeTree.delete(removed.method + removed.path);
        }
      }
    else this.routeTree.set(method + path, this.router.history.length);
    const history = this.router.history;
    const index = this.router.history.length;
    const mainHandler = shouldPrecompile ? compile() : (ctx) => (history[index].composed = compile())(
      ctx
    );
    const isWebSocket = method === "$INTERNALWS";
    this.router.history.push({
      method,
      path,
      composed: mainHandler,
      handler: handle,
      hooks,
      compile: () => compile(),
      websocket: localHook.websocket
    });
    const staticRouter = this.router.static.http;
    const handler = {
      handler: shouldPrecompile ? mainHandler : void 0,
      compile
    };
    if (isWebSocket) {
      const loose = getLoosePath(path);
      if (path.indexOf(":") === -1 && path.indexOf("*") === -1) {
        this.router.static.ws[path] = index;
      } else {
        this.router.ws.add("ws", path, handler);
        if (loose) this.router.ws.add("ws", loose, handler);
      }
      return;
    }
    if (path.indexOf(":") === -1 && path.indexOf("*") === -1) {
      if (!staticRouter.map[path])
        staticRouter.map[path] = {
          code: ""
        };
      const ctx = staticHandler ? "" : "c";
      if (method === "ALL")
        staticRouter.map[path].all = `default:return ht[${index}].composed(${ctx})
`;
      else
        staticRouter.map[path].code = `case '${method}':return ht[${index}].composed(${ctx})
${staticRouter.map[path].code}`;
      if (!this.config.strictPath && this.config.nativeStaticResponse === true && nativeStaticHandler && (method === "GET" || method === "ALL"))
        this.router.static.http.static[getLoosePath(path)] = nativeStaticHandler();
    } else {
      this.router.http.add(method, path, handler);
      if (!this.config.strictPath) {
        const loosePath = getLoosePath(path);
        if (this.config.nativeStaticResponse === true && staticHandler && (method === "GET" || method === "ALL"))
          this.router.static.http.static[loosePath] = staticHandler();
        this.router.http.add(method, loosePath, handler);
      }
    }
  }
  headers(header) {
    if (!header) return this;
    if (!this.setHeaders) this.setHeaders = {};
    this.setHeaders = mergeDeep(this.setHeaders, header);
    return this;
  }
  /**
   * ### start | Life cycle event
   * Called after server is ready for serving
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onStart(({ server }) => {
   *         console.log("Running at ${server?.url}:${server?.port}")
   *     })
   *     .listen(3000)
   * ```
   */
  onStart(handler) {
    this.on("start", handler);
    return this;
  }
  /**
   * ### request | Life cycle event
   * Called on every new request is accepted
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onRequest(({ method, url }) => {
   *         saveToAnalytic({ method, url })
   *     })
   * ```
   */
  onRequest(handler) {
    this.on("request", handler);
    return this;
  }
  onParse(options, handler) {
    if (!handler) {
      if (typeof options === "string")
        return this.on("parse", this["~parser"][options]);
      return this.on("parse", options);
    }
    return this.on(
      options,
      "parse",
      handler
    );
  }
  /**
   * ### parse | Life cycle event
   * Callback function to handle body parsing
   *
   * If truthy value is returned, will be assigned to `context.body`
   * Otherwise will skip the callback and look for the next one.
   *
   * Equivalent to Express's body parser
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onParse((request, contentType) => {
   *         if(contentType === "application/json")
   *             return request.json()
   *     })
   * ```
   */
  parser(name, parser) {
    this["~parser"][name] = parser;
    return this;
  }
  onTransform(options, handler) {
    if (!handler) return this.on("transform", options);
    return this.on(
      options,
      "transform",
      handler
    );
  }
  resolve(optionsOrResolve, resolve) {
    if (!resolve) {
      resolve = optionsOrResolve;
      optionsOrResolve = { as: "local" };
    }
    const hook = {
      subType: "resolve",
      fn: resolve
    };
    return this.onBeforeHandle(optionsOrResolve, hook);
  }
  mapResolve(optionsOrResolve, mapper) {
    if (!mapper) {
      mapper = optionsOrResolve;
      optionsOrResolve = { as: "local" };
    }
    const hook = {
      subType: "mapResolve",
      fn: mapper
    };
    return this.onBeforeHandle(optionsOrResolve, hook);
  }
  onBeforeHandle(options, handler) {
    if (!handler) return this.on("beforeHandle", options);
    return this.on(
      options,
      "beforeHandle",
      handler
    );
  }
  onAfterHandle(options, handler) {
    if (!handler) return this.on("afterHandle", options);
    return this.on(
      options,
      "afterHandle",
      handler
    );
  }
  mapResponse(options, handler) {
    if (!handler) return this.on("mapResponse", options);
    return this.on(
      options,
      "mapResponse",
      handler
    );
  }
  onAfterResponse(options, handler) {
    if (!handler) return this.on("afterResponse", options);
    return this.on(
      options,
      "afterResponse",
      handler
    );
  }
  /**
   * ### After Handle | Life cycle event
   * Intercept request **after** main handler is called.
   *
   * If truthy value is returned, will be assigned as `Response`
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onAfterHandle((context, response) => {
   *         if(typeof response === "object")
   *             return JSON.stringify(response)
   *     })
   * ```
   */
  trace(options, handler) {
    if (!handler) {
      handler = options;
      options = { as: "local" };
    }
    if (!Array.isArray(handler)) handler = [handler];
    for (const fn of handler)
      this.on(
        options,
        "trace",
        createTracer(fn)
      );
    return this;
  }
  error(name, error2) {
    switch (typeof name) {
      case "string":
        error2.prototype[ERROR_CODE] = name;
        this.definitions.error[name] = error2;
        return this;
      case "function":
        this.definitions.error = name(this.definitions.error);
        return this;
    }
    for (const [code, error3] of Object.entries(name)) {
      error3.prototype[ERROR_CODE] = code;
      this.definitions.error[code] = error3;
    }
    return this;
  }
  /**
   * ### Error | Life cycle event
   * Called when error is thrown during processing request
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onError(({ code }) => {
   *         if(code === "NOT_FOUND")
   *             return "Path not found :("
   *     })
   * ```
   */
  onError(options, handler) {
    if (!handler) return this.on("error", options);
    return this.on(
      options,
      "error",
      handler
    );
  }
  /**
   * ### stop | Life cycle event
   * Called after server stop serving request
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .onStop((app) => {
   *         cleanup()
   *     })
   * ```
   */
  onStop(handler) {
    this.on("stop", handler);
    return this;
  }
  on(optionsOrType, typeOrHandlers, handlers) {
    let type2;
    switch (typeof optionsOrType) {
      case "string":
        type2 = optionsOrType;
        handlers = typeOrHandlers;
        break;
      case "object":
        type2 = typeOrHandlers;
        if (!Array.isArray(typeOrHandlers) && typeof typeOrHandlers === "object")
          handlers = typeOrHandlers;
        break;
    }
    if (Array.isArray(handlers)) handlers = fnToContainer(handlers);
    else {
      if (typeof handlers === "function")
        handlers = [
          {
            fn: handlers
          }
        ];
      else handlers = [handlers];
    }
    const handles = handlers;
    for (const handle of handles) {
      handle.scope = typeof optionsOrType === "string" ? "local" : (optionsOrType == null ? void 0 : optionsOrType.as) ?? "local";
      if (type2 === "resolve" || type2 === "derive") handle.subType = type2;
    }
    if (type2 !== "trace")
      sucrose(
        {
          [type2]: handles.map((x) => x.fn)
        },
        this.inference
      );
    for (const handle of handles) {
      const fn = asHookType(handle, "global", { skipIfHasType: true });
      switch (type2) {
        case "start":
          this.event.start.push(fn);
          break;
        case "request":
          this.event.request.push(fn);
          break;
        case "parse":
          this.event.parse.push(fn);
          break;
        case "transform":
          this.event.transform.push(fn);
          break;
        // @ts-expect-error
        case "derive":
          this.event.transform.push(
            fnToContainer(fn, "derive")
          );
          break;
        case "beforeHandle":
          this.event.beforeHandle.push(fn);
          break;
        // @ts-expect-error
        // eslint-disable-next-line sonarjs/no-duplicated-branches
        case "resolve":
          this.event.beforeHandle.push(
            fnToContainer(fn, "resolve")
          );
          break;
        case "afterHandle":
          this.event.afterHandle.push(fn);
          break;
        case "mapResponse":
          this.event.mapResponse.push(fn);
          break;
        case "afterResponse":
          this.event.afterResponse.push(fn);
          break;
        case "trace":
          this.event.trace.push(fn);
          break;
        case "error":
          this.event.error.push(fn);
          break;
        case "stop":
          this.event.stop.push(fn);
          break;
      }
    }
    return this;
  }
  /**
   * @deprecated use `Elysia.as` instead
   *
   * Will be removed in Elysia 1.2
   */
  propagate() {
    promoteEvent(this.event.parse);
    promoteEvent(this.event.transform);
    promoteEvent(this.event.beforeHandle);
    promoteEvent(this.event.afterHandle);
    promoteEvent(this.event.mapResponse);
    promoteEvent(this.event.afterResponse);
    promoteEvent(this.event.trace);
    promoteEvent(this.event.error);
    return this;
  }
  as(type2) {
    const castType = { plugin: "scoped", scoped: "scoped", global: "global" }[type2];
    promoteEvent(this.event.parse, castType);
    promoteEvent(this.event.transform, castType);
    promoteEvent(this.event.beforeHandle, castType);
    promoteEvent(this.event.afterHandle, castType);
    promoteEvent(this.event.mapResponse, castType);
    promoteEvent(this.event.afterResponse, castType);
    promoteEvent(this.event.trace, castType);
    promoteEvent(this.event.error, castType);
    if (type2 === "plugin") {
      this.validator.scoped = mergeSchemaValidator(
        this.validator.scoped,
        this.validator.local
      );
      this.validator.local = null;
    } else if (type2 === "global") {
      this.validator.global = mergeSchemaValidator(
        this.validator.global,
        mergeSchemaValidator(
          this.validator.scoped,
          this.validator.local
        )
      );
      this.validator.scoped = null;
      this.validator.local = null;
    }
    return this;
  }
  /**
   * ### group
   * Encapsulate and group path with prefix
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .group('/v1', app => app
   *         .get('/', () => 'Hi')
   *         .get('/name', () => 'Elysia')
   *     })
   * ```
   */
  group(prefix, schemaOrRun, run) {
    const instance = new Elysia({
      ...this.config,
      prefix: ""
    });
    instance.singleton = { ...this.singleton };
    instance.definitions = { ...this.definitions };
    instance.getServer = () => this.getServer();
    instance.inference = cloneInference(this.inference);
    instance.extender = { ...this.extender };
    const isSchema = typeof schemaOrRun === "object";
    const sandbox = (isSchema ? run : schemaOrRun)(instance);
    this.singleton = mergeDeep(this.singleton, instance.singleton);
    this.definitions = mergeDeep(this.definitions, instance.definitions);
    if (sandbox.event.request.length)
      this.event.request = [
        ...this.event.request || [],
        ...sandbox.event.request || []
      ];
    if (sandbox.event.mapResponse.length)
      this.event.mapResponse = [
        ...this.event.mapResponse || [],
        ...sandbox.event.mapResponse || []
      ];
    this.model(sandbox.definitions.type);
    Object.values(instance.router.history).forEach(
      ({ method, path, handler, hooks }) => {
        path = (isSchema ? "" : this.config.prefix) + prefix + path;
        if (isSchema) {
          const hook = schemaOrRun;
          const localHook = hooks;
          this.add(
            method,
            path,
            handler,
            mergeHook(hook, {
              ...localHook || {},
              error: !localHook.error ? sandbox.event.error : Array.isArray(localHook.error) ? [
                ...localHook.error || {},
                ...sandbox.event.error || {}
              ] : [
                localHook.error,
                ...sandbox.event.error || {}
              ]
            })
          );
        } else {
          this.add(
            method,
            path,
            handler,
            mergeHook(hooks, {
              error: sandbox.event.error
            }),
            {
              skipPrefix: true
            }
          );
        }
      }
    );
    return this;
  }
  /**
   * ### guard
   * Encapsulate and pass hook into all child handler
   *
   * ---
   * @example
   * ```typescript
   * import { t } from 'elysia'
   *
   * new Elysia()
   *     .guard({
   *          schema: {
   *              body: t.Object({
   *                  username: t.String(),
   *                  password: t.String()
   *              })
   *          }
   *     }, app => app
   *         .get("/", () => 'Hi')
   *         .get("/name", () => 'Elysia')
   *     })
   * ```
   */
  guard(hook, run) {
    var _a2, _b, _c, _d, _e, _f;
    if (!run) {
      if (typeof hook === "object") {
        this.applyMacro(hook);
        const type2 = hook.as ?? "local";
        this.validator[type2] = {
          body: hook.body ?? ((_a2 = this.validator[type2]) == null ? void 0 : _a2.body),
          headers: hook.headers ?? ((_b = this.validator[type2]) == null ? void 0 : _b.headers),
          params: hook.params ?? ((_c = this.validator[type2]) == null ? void 0 : _c.params),
          query: hook.query ?? ((_d = this.validator[type2]) == null ? void 0 : _d.query),
          response: hook.response ?? ((_e = this.validator[type2]) == null ? void 0 : _e.response),
          cookie: hook.cookie ?? ((_f = this.validator[type2]) == null ? void 0 : _f.cookie)
        };
        if (hook.parse) this.on({ as: type2 }, "parse", hook.parse);
        if (hook.transform)
          this.on({ as: type2 }, "transform", hook.transform);
        if (hook.derive) this.on({ as: type2 }, "derive", hook.derive);
        if (hook.beforeHandle)
          this.on({ as: type2 }, "beforeHandle", hook.beforeHandle);
        if (hook.resolve) this.on({ as: type2 }, "resolve", hook.resolve);
        if (hook.afterHandle)
          this.on({ as: type2 }, "afterHandle", hook.afterHandle);
        if (hook.mapResponse)
          this.on({ as: type2 }, "mapResponse", hook.mapResponse);
        if (hook.afterResponse)
          this.on({ as: type2 }, "afterResponse", hook.afterResponse);
        if (hook.error) this.on({ as: type2 }, "error", hook.error);
        if (hook.detail) {
          if (this.config.detail)
            this.config.detail = mergeDeep(
              Object.assign({}, this.config.detail),
              hook.detail
            );
          else this.config.detail = hook.detail;
        }
        if (hook == null ? void 0 : hook.tags) {
          if (!this.config.detail)
            this.config.detail = {
              tags: hook.tags
            };
          else this.config.detail.tags = hook.tags;
        }
        return this;
      }
      return this.guard({}, hook);
    }
    const instance = new Elysia({
      ...this.config,
      prefix: ""
    });
    instance.singleton = { ...this.singleton };
    instance.definitions = { ...this.definitions };
    instance.inference = cloneInference(this.inference);
    instance.extender = { ...this.extender };
    const sandbox = run(instance);
    this.singleton = mergeDeep(this.singleton, instance.singleton);
    this.definitions = mergeDeep(this.definitions, instance.definitions);
    sandbox.getServer = () => this.server;
    if (sandbox.event.request.length)
      this.event.request = [
        ...this.event.request || [],
        ...sandbox.event.request || []
      ];
    if (sandbox.event.mapResponse.length)
      this.event.mapResponse = [
        ...this.event.mapResponse || [],
        ...sandbox.event.mapResponse || []
      ];
    this.model(sandbox.definitions.type);
    Object.values(instance.router.history).forEach(
      ({ method, path, handler, hooks: localHook }) => {
        this.add(
          method,
          path,
          handler,
          mergeHook(hook, {
            ...localHook || {},
            error: !localHook.error ? sandbox.event.error : Array.isArray(localHook.error) ? [
              ...localHook.error || {},
              ...sandbox.event.error || []
            ] : [
              localHook.error,
              ...sandbox.event.error || []
            ]
          })
        );
      }
    );
    return this;
  }
  /**
   * ### use
   * Merge separate logic of Elysia with current
   *
   * ---
   * @example
   * ```typescript
   * const plugin = (app: Elysia) => app
   *     .get('/plugin', () => 'hi')
   *
   * new Elysia()
   *     .use(plugin)
   * ```
   */
  use(plugin, options) {
    if (Array.isArray(plugin)) {
      let app = this;
      for (const p of plugin) app = app.use(p);
      return app;
    }
    if (options == null ? void 0 : options.scoped)
      return this.guard({}, (app) => app.use(plugin));
    if (Array.isArray(plugin)) {
      let current = this;
      for (const p of plugin) current = this.use(p);
      return current;
    }
    if (plugin instanceof Promise) {
      this.promisedModules.add(
        plugin.then((plugin2) => {
          if (typeof plugin2 === "function") return plugin2(this);
          if (plugin2 instanceof Elysia)
            return this._use(plugin2).compile();
          if (plugin2.constructor.name === "Elysia")
            return this._use(
              plugin2
            ).compile();
          if (typeof plugin2.default === "function")
            return plugin2.default(this);
          if (plugin2.default instanceof Elysia)
            return this._use(plugin2.default);
          if (plugin2.constructor.name === "Elysia")
            return this._use(plugin2.default);
          throw new Error(
            'Invalid plugin type. Expected Elysia instance, function, or module with "default" as Elysia instance or function that returns Elysia instance.'
          );
        }).then((x) => x.compile())
      );
      return this;
    }
    return this._use(plugin);
  }
  _use(plugin) {
    var _a2;
    if (typeof plugin === "function") {
      const instance = plugin(this);
      if (instance instanceof Promise) {
        this.promisedModules.add(
          instance.then((plugin2) => {
            if (plugin2 instanceof Elysia) {
              plugin2.getServer = () => this.getServer();
              plugin2.getGlobalRoutes = () => this.getGlobalRoutes();
              plugin2.model(this.definitions.type);
              plugin2.error(this.definitions.error);
              for (const {
                method,
                path,
                handler,
                hooks
              } of Object.values(plugin2.router.history)) {
                this.add(
                  method,
                  path,
                  handler,
                  mergeHook(hooks, {
                    error: plugin2.event.error
                  })
                );
              }
              plugin2.compile();
              return plugin2;
            }
            if (typeof plugin2 === "function")
              return plugin2(
                this
              );
            if (typeof plugin2.default === "function")
              return plugin2.default(
                this
              );
            return this._use(plugin2);
          }).then((x) => x.compile())
        );
        return this;
      }
      return instance;
    }
    const { name, seed } = plugin.config;
    plugin.getServer = () => this.getServer();
    plugin.getGlobalRoutes = () => this.getGlobalRoutes();
    plugin.model(this.definitions.type);
    plugin.error(this.definitions.error);
    this["~parser"] = {
      ...plugin["~parser"],
      ...this["~parser"]
    };
    this.headers(plugin.setHeaders);
    if (name) {
      if (!(name in this.dependencies)) this.dependencies[name] = [];
      const current = seed !== void 0 ? checksum(name + JSON.stringify(seed)) : 0;
      if (!this.dependencies[name].some(
        ({ checksum: checksum3 }) => current === checksum3
      )) {
        this.extender.macros = this.extender.macros.concat(
          plugin.extender.macros
        );
        this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
          plugin.extender.higherOrderFunctions
        );
      }
    } else {
      this.extender.macros = this.extender.macros.concat(
        plugin.extender.macros
      );
      this.extender.higherOrderFunctions = this.extender.higherOrderFunctions.concat(
        plugin.extender.higherOrderFunctions
      );
    }
    deduplicateChecksum(this.extender.macros);
    deduplicateChecksum(this.extender.higherOrderFunctions);
    const hofHashes = [];
    for (let i = 0; i < this.extender.higherOrderFunctions.length; i++) {
      const hof = this.extender.higherOrderFunctions[i];
      if (hof.checksum) {
        if (hofHashes.includes(hof.checksum)) {
          this.extender.higherOrderFunctions.splice(i, 1);
          i--;
        }
        hofHashes.push(hof.checksum);
      }
    }
    this.inference = {
      body: this.inference.body || plugin.inference.body,
      cookie: this.inference.cookie || plugin.inference.cookie,
      headers: this.inference.headers || plugin.inference.headers,
      query: this.inference.query || plugin.inference.query,
      set: this.inference.set || plugin.inference.set,
      server: this.inference.server || plugin.inference.server,
      request: this.inference.request || plugin.inference.request,
      route: this.inference.route || plugin.inference.route
    };
    this.decorate(plugin.singleton.decorator);
    this.state(plugin.singleton.store);
    this.model(plugin.definitions.type);
    this.error(plugin.definitions.error);
    plugin.extender.macros = this.extender.macros.concat(
      plugin.extender.macros
    );
    for (const { method, path, handler, hooks } of Object.values(
      plugin.router.history
    )) {
      this.add(
        method,
        path,
        handler,
        mergeHook(hooks, {
          error: plugin.event.error
        })
      );
    }
    if (name) {
      if (!(name in this.dependencies)) this.dependencies[name] = [];
      const current = seed !== void 0 ? checksum(name + JSON.stringify(seed)) : 0;
      if (this.dependencies[name].some(
        ({ checksum: checksum3 }) => current === checksum3
      ))
        return this;
      this.dependencies[name].push(
        ((_a2 = this.config) == null ? void 0 : _a2.analytic) ? {
          name: plugin.config.name,
          seed: plugin.config.seed,
          checksum: current,
          dependencies: plugin.dependencies,
          stack: plugin.telemetry.stack,
          routes: plugin.router.history,
          decorators: plugin.singleton,
          store: plugin.singleton.store,
          error: plugin.definitions.error,
          derive: plugin.event.transform.filter((x) => (x == null ? void 0 : x.subType) === "derive").map((x) => ({
            fn: x.toString(),
            stack: new Error().stack ?? ""
          })),
          resolve: plugin.event.transform.filter((x) => (x == null ? void 0 : x.subType) === "resolve").map((x) => ({
            fn: x.toString(),
            stack: new Error().stack ?? ""
          }))
        } : {
          name: plugin.config.name,
          seed: plugin.config.seed,
          checksum: current,
          dependencies: plugin.dependencies
        }
      );
      this.event = mergeLifeCycle(
        this.event,
        filterGlobalHook(plugin.event),
        current
      );
    } else {
      this.event = mergeLifeCycle(
        this.event,
        filterGlobalHook(plugin.event)
      );
    }
    this.validator.global = mergeHook(this.validator.global, {
      ...plugin.validator.global
    });
    this.validator.local = mergeHook(this.validator.local, {
      ...plugin.validator.scoped
    });
    return this;
  }
  macro(macro) {
    if (typeof macro === "function") {
      const hook = {
        checksum: checksum(
          JSON.stringify({
            name: this.config.name,
            seed: this.config.seed,
            content: macro.toString()
          })
        ),
        fn: macro
      };
      this.extender.macros.push(hook);
    } else if (typeof macro === "object") {
      for (const name of Object.keys(macro))
        if (typeof macro[name] === "object") {
          const actualValue = { ...macro[name] };
          macro[name] = (v) => {
            if (v === true) return actualValue;
          };
        }
      const hook = {
        checksum: checksum(
          JSON.stringify({
            name: this.config.name,
            seed: this.config.seed,
            content: Object.entries(macro).map(([k, v]) => `${k}+${v}`).join(",")
          })
        ),
        fn: () => macro
      };
      this.extender.macros.push(hook);
    }
    return this;
  }
  mount(path, handle) {
    if (path instanceof Elysia || typeof path === "function" || path.length === 0 || path === "/") {
      const run = typeof path === "function" ? path : path instanceof Elysia ? path.compile().fetch : handle instanceof Elysia ? handle.compile().fetch : handle;
      const handler2 = async ({ request, path: path2 }) => {
        if (request.method === "GET" || request.method === "HEAD" || !request.headers.get("content-type"))
          return run(
            new Request(
              replaceUrlPath(request.url, path2 || "/"),
              request
            )
          );
        return run(
          new Request(replaceUrlPath(request.url, path2 || "/"), {
            ...request,
            body: await request.arrayBuffer()
          })
        );
      };
      this.all(
        "/*",
        handler2,
        {
          type: "none"
        }
      );
      return this;
    }
    const length = path.length;
    if (handle instanceof Elysia) handle = handle.compile().fetch;
    const handler = async ({ request, path: path2 }) => {
      if (request.method === "GET" || request.method === "HEAD" || !request.headers.get("content-type"))
        return handle(
          new Request(
            replaceUrlPath(request.url, path2.slice(length) || "/"),
            request
          )
        );
      return handle(
        new Request(
          replaceUrlPath(request.url, path2.slice(length) || "/"),
          {
            ...request,
            body: await request.arrayBuffer()
          }
        )
      );
    };
    this.all(
      path,
      handler,
      {
        type: "none"
      }
    );
    this.all(
      path + (path.endsWith("/") ? "*" : "/*"),
      handler,
      {
        type: "none"
      }
    );
    return this;
  }
  /**
   * ### get
   * Register handler for path with method [GET]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .get('/', () => 'hi')
   *     .get('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  get(path, handler, hook) {
    this.add("GET", path, handler, hook);
    return this;
  }
  /**
   * ### post
   * Register handler for path with method [POST]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .post('/', () => 'hi')
   *     .post('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  post(path, handler, hook) {
    this.add("POST", path, handler, hook);
    return this;
  }
  /**
   * ### put
   * Register handler for path with method [PUT]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .put('/', () => 'hi')
   *     .put('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  put(path, handler, hook) {
    this.add("PUT", path, handler, hook);
    return this;
  }
  /**
   * ### patch
   * Register handler for path with method [PATCH]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .patch('/', () => 'hi')
   *     .patch('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  patch(path, handler, hook) {
    this.add("PATCH", path, handler, hook);
    return this;
  }
  /**
   * ### delete
   * Register handler for path with method [DELETE]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .delete('/', () => 'hi')
   *     .delete('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  delete(path, handler, hook) {
    this.add("DELETE", path, handler, hook);
    return this;
  }
  /**
   * ### options
   * Register handler for path with method [POST]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .options('/', () => 'hi')
   *     .options('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  options(path, handler, hook) {
    this.add("OPTIONS", path, handler, hook);
    return this;
  }
  /**
   * ### all
   * Register handler for path with method [ALL]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .all('/', () => 'hi')
   *     .all('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  all(path, handler, hook) {
    this.add("ALL", path, handler, hook);
    return this;
  }
  /**
   * ### head
   * Register handler for path with method [HEAD]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .head('/', () => 'hi')
   *     .head('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  head(path, handler, hook) {
    this.add("HEAD", path, handler, hook);
    return this;
  }
  /**
   * ### connect
   * Register handler for path with method [CONNECT]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .connect('/', () => 'hi')
   *     .connect('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  connect(path, handler, hook) {
    this.add("CONNECT", path, handler, hook);
    return this;
  }
  /**
   * ### route
   * Register handler for path with method [ROUTE]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .route('/', () => 'hi')
   *     .route('/with-hook', () => 'hi', {
   *         response: t.String()
   *     })
   * ```
   */
  route(method, path, handler, hook) {
    this.add(method.toUpperCase(), path, handler, hook, hook == null ? void 0 : hook.config);
    return this;
  }
  /**
   * ### ws
   * Register handler for path with method [ws]
   *
   * ---
   * @example
   * ```typescript
   * import { Elysia, t } from 'elysia'
   *
   * new Elysia()
   *     .ws('/', {
   *         message(ws, message) {
   *             ws.send(message)
   *         }
   *     })
   * ```
   */
  ws(path, options) {
    if (this["~adapter"].ws) this["~adapter"].ws(this, path, options);
    else console.warn(`Current adapter doesn't support WebSocket`);
    return this;
  }
  /**
   * ### state
   * Assign global mutatable state accessible for all handler
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .state('counter', 0)
   *     .get('/', (({ counter }) => ++counter)
   * ```
   */
  state(options, name, value) {
    if (name === void 0) {
      value = options;
      options = { as: "append" };
      name = "";
    } else if (value === void 0) {
      if (typeof options === "string") {
        value = name;
        name = options;
        options = { as: "append" };
      } else if (typeof options === "object") {
        value = name;
        name = "";
      }
    }
    const { as } = options;
    if (typeof name !== "string") return this;
    switch (typeof value) {
      case "object":
        if (name) {
          if (name in this.singleton.store)
            this.singleton.store[name] = mergeDeep(
              this.singleton.store[name],
              value,
              {
                override: as === "override"
              }
            );
          else this.singleton.store[name] = value;
          return this;
        }
        if (value === null) return this;
        this.singleton.store = mergeDeep(this.singleton.store, value, {
          override: as === "override"
        });
        return this;
      case "function":
        if (name) {
          if (as === "override" || !(name in this.singleton.store))
            this.singleton.store[name] = value;
        } else this.singleton.store = value(this.singleton.store);
        return this;
      default:
        if (as === "override" || !(name in this.singleton.store))
          this.singleton.store[name] = value;
        return this;
    }
  }
  /**
   * ### decorate
   * Define custom method to `Context` accessible for all handler
   *
   * ---
   * @example
   * ```typescript
   * new Elysia()
   *     .decorate('getDate', () => Date.now())
   *     .get('/', (({ getDate }) => getDate())
   * ```
   */
  decorate(options, name, value) {
    if (name === void 0) {
      value = options;
      options = { as: "append" };
      name = "";
    } else if (value === void 0) {
      if (typeof options === "string") {
        value = name;
        name = options;
        options = { as: "append" };
      } else if (typeof options === "object") {
        value = name;
        name = "";
      }
    }
    const { as } = options;
    if (typeof name !== "string") return this;
    switch (typeof value) {
      case "object":
        if (name) {
          if (name in this.singleton.decorator)
            this.singleton.decorator[name] = mergeDeep(
              this.singleton.decorator[name],
              value,
              {
                override: as === "override"
              }
            );
          else this.singleton.decorator[name] = value;
          return this;
        }
        if (value === null) return this;
        this.singleton.decorator = mergeDeep(
          this.singleton.decorator,
          value,
          {
            override: as === "override"
          }
        );
        return this;
      case "function":
        if (name) {
          if (as === "override" || !(name in this.singleton.decorator))
            this.singleton.decorator[name] = value;
        } else
          this.singleton.decorator = value(this.singleton.decorator);
        return this;
      default:
        if (as === "override" || !(name in this.singleton.decorator))
          this.singleton.decorator[name] = value;
        return this;
    }
  }
  derive(optionsOrTransform, transform) {
    if (!transform) {
      transform = optionsOrTransform;
      optionsOrTransform = { as: "local" };
    }
    const hook = {
      subType: "derive",
      fn: transform
    };
    return this.onTransform(optionsOrTransform, hook);
  }
  model(name, model) {
    const coerce = (schema) => replaceSchemaType(schema, [
      {
        from: t.Number(),
        to: (options) => t.Numeric(options),
        untilObjectFound: true
      },
      {
        from: t.Boolean(),
        to: (options) => t.BooleanString(options),
        untilObjectFound: true
      }
    ]);
    switch (typeof name) {
      case "object":
        const parsedSchemas = {};
        Object.entries(name).forEach(([key, value]) => {
          if (!(key in this.definitions.type))
            parsedSchemas[key] = this.definitions.type[key] = coerce(value);
        });
        this.definitions.typebox = t.Module({
          ...this.definitions.typebox["$defs"],
          ...parsedSchemas
        });
        return this;
      case "function":
        const result = coerce(name(this.definitions.type));
        this.definitions.type = result;
        this.definitions.typebox = t.Module(result);
        return this;
    }
    this.definitions.type[name] = model;
    this.definitions.typebox = t.Module({
      ...this.definitions.typebox["$defs"],
      [name]: model
    });
    return this;
  }
  mapDerive(optionsOrDerive, mapper) {
    if (!mapper) {
      mapper = optionsOrDerive;
      optionsOrDerive = { as: "local" };
    }
    const hook = {
      subType: "mapDerive",
      fn: mapper
    };
    return this.onTransform(optionsOrDerive, hook);
  }
  affix(base, type2, word) {
    if (word === "") return this;
    const delimieter = ["_", "-", " "];
    const capitalize2 = (word2) => word2[0].toUpperCase() + word2.slice(1);
    const joinKey = base === "prefix" ? (prefix, word2) => delimieter.includes(prefix.at(-1) ?? "") ? prefix + word2 : prefix + capitalize2(word2) : delimieter.includes(word.at(-1) ?? "") ? (suffix, word2) => word2 + suffix : (suffix, word2) => word2 + capitalize2(suffix);
    const remap = (type22) => {
      const store = {};
      switch (type22) {
        case "decorator":
          for (const key in this.singleton.decorator) {
            store[joinKey(word, key)] = this.singleton.decorator[key];
          }
          this.singleton.decorator = store;
          break;
        case "state":
          for (const key in this.singleton.store)
            store[joinKey(word, key)] = this.singleton.store[key];
          this.singleton.store = store;
          break;
        case "model":
          for (const key in this.definitions.type)
            store[joinKey(word, key)] = this.definitions.type[key];
          this.definitions.type = store;
          break;
        case "error":
          for (const key in this.definitions.error)
            store[joinKey(word, key)] = this.definitions.error[key];
          this.definitions.error = store;
          break;
      }
    };
    const types = Array.isArray(type2) ? type2 : [type2];
    for (const type22 of types.some((x) => x === "all") ? ["decorator", "state", "model", "error"] : types)
      remap(type22);
    return this;
  }
  prefix(type2, word) {
    return this.affix("prefix", type2, word);
  }
  suffix(type2, word) {
    return this.affix("suffix", type2, word);
  }
  compile() {
    var _a2, _b;
    if (this["~adapter"].isWebStandard) {
      this.fetch = this.config.aot ? composeGeneralHandler(this) : createDynamicHandler(this);
      if (typeof ((_a2 = this.server) == null ? void 0 : _a2.reload) === "function")
        this.server.reload({
          ...this.server || {},
          fetch: this.fetch
        });
      return this;
    }
    if (typeof ((_b = this.server) == null ? void 0 : _b.reload) === "function")
      this.server.reload(this.server || {});
    this._handle = composeGeneralHandler(this);
    return this;
  }
  /**
   * Wait until all lazy loaded modules all load is fully
   */
  get modules() {
    return Promise.all(this.promisedModules.promises);
  }
}
const a = `.light-mode {
  --scalar-color-1: #2a2f45;
  --scalar-color-2: #757575;
  --scalar-color-3: #8e8e8e;
  --scalar-color-accent: #f06292;

  --scalar-background-1: #fff;
  --scalar-background-2: #f6f6f6;
  --scalar-background-3: #e7e7e7;

  --scalar-border-color: rgba(0, 0, 0, 0.1);
}
.dark-mode {
  --scalar-color-1: rgba(255, 255, 255, 0.9);
  --scalar-color-2: rgba(156, 163, 175, 1);
  --scalar-color-3: rgba(255, 255, 255, 0.44);
  --scalar-color-accent: #f06292;

  --scalar-background-1: #111728;
  --scalar-background-2: #1e293b;
  --scalar-background-3: #334155;
  --scalar-background-accent: #f062921f;

  --scalar-border-color: rgba(255, 255, 255, 0.1);
}

/* Document Sidebar */
.light-mode .t-doc__sidebar,
.dark-mode .t-doc__sidebar {
  --scalar-sidebar-background-1: var(--scalar-background-1);
  --scalar-sidebar-color-1: var(--scalar-color-1);
  --scalar-sidebar-color-2: var(--scalar-color-2);
  --scalar-sidebar-border-color: var(--scalar-border-color);

  --scalar-sidebar-item-hover-background: var(--scalar-background-2);
  --scalar-sidebar-item-hover-color: currentColor;

  --scalar-sidebar-item-active-background: #f062921f;
  --scalar-sidebar-color-active: var(--scalar-color-accent);

  --scalar-sidebar-search-background: transparent;
  --scalar-sidebar-search-color: var(--scalar-color-3);
  --scalar-sidebar-search-border-color: var(--scalar-border-color);
}

/* advanced */
.light-mode {
  --scalar-button-1: rgb(49 53 56);
  --scalar-button-1-color: #fff;
  --scalar-button-1-hover: rgb(28 31 33);

  --scalar-color-green: #069061;
  --scalar-color-red: #ef0006;
  --scalar-color-yellow: #edbe20;
  --scalar-color-blue: #0082d0;
  --scalar-color-orange: #fb892c;
  --scalar-color-purple: #5203d1;

  --scalar-scrollbar-color: rgba(0, 0, 0, 0.18);
  --scalar-scrollbar-color-active: rgba(0, 0, 0, 0.36);
}
.dark-mode {
  --scalar-button-1: #f6f6f6;
  --scalar-button-1-color: #000;
  --scalar-button-1-hover: #e7e7e7;

  --scalar-color-green: #a3ffa9;
  --scalar-color-red: #ffa3a3;
  --scalar-color-yellow: #fffca3;
  --scalar-color-blue: #a5d6ff;
  --scalar-color-orange: #e2ae83;
  --scalar-color-purple: #d2a8ff;

  --scalar-scrollbar-color: rgba(255, 255, 255, 0.24);
  --scalar-scrollbar-color-active: rgba(255, 255, 255, 0.48);
}
.section-flare {
  width: 100%;
  height: 400px;
  position: absolute;
}
.section-flare-item:first-of-type:before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  --stripes: repeating-linear-gradient(
    100deg,
    #fff 0%,
    #fff 0%,
    transparent 2%,
    transparent 12%,
    #fff 17%
  );
  --stripesDark: repeating-linear-gradient(
    100deg,
    #000 0%,
    #000 0%,
    transparent 10%,
    transparent 12%,
    #000 17%
  );
  --rainbow: repeating-linear-gradient(
    100deg,
    #60a5fa 10%,
    #e879f9 16%,
    #5eead4 22%,
    #60a5fa 30%
  );
  contain: strict;
  contain-intrinsic-size: 100vw 40vh;
  background-image: var(--stripesDark), var(--rainbow);
  background-size: 300%, 200%;
  background-position:
    50% 50%,
    50% 50%;
  filter: opacity(20%) saturate(200%);
  -webkit-mask-image: radial-gradient(
    ellipse at 100% 0%,
    black 40%,
    transparent 70%
  );
  mask-image: radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%);
  pointer-events: none;
}
.section-flare-item:first-of-type:after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-image: var(--stripes), var(--rainbow);
  background-size: 200%, 100%;
  background-attachment: fixed;
  mix-blend-mode: difference;
  background-image: var(--stripesDark), var(--rainbow);
  pointer-events: none;
}
.light-mode .section-flare-item:first-of-type:after,
.light-mode .section-flare-item:first-of-type:before {
  background-image: var(--stripes), var(--rainbow);
  filter: opacity(4%) saturate(200%);
}
`;
const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _UNC_REGEX = /^[/\\]{2}/;
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
const normalize = function(path) {
  if (path.length === 0) {
    return ".";
  }
  path = normalizeWindowsPath(path);
  const isUNCPath = path.match(_UNC_REGEX);
  const isPathAbsolute = isAbsolute(path);
  const trailingSeparator = path[path.length - 1] === "/";
  path = normalizeString(path, !isPathAbsolute);
  if (path.length === 0) {
    if (isPathAbsolute) {
      return "/";
    }
    return trailingSeparator ? "./" : ".";
  }
  if (trailingSeparator) {
    path += "/";
  }
  if (_DRIVE_LETTER_RE.test(path)) {
    path += "/";
  }
  if (isUNCPath) {
    if (!isPathAbsolute) {
      return `//./${path}`;
    }
    return `//${path}`;
  }
  return isPathAbsolute && !isAbsolute(path) ? `/${path}` : path;
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ;
      else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
function isSchemaObject(schema) {
  return "type" in schema || "properties" in schema || "items" in schema;
}
function isDateTimeProperty(key, schema) {
  return (key === "createdAt" || key === "updatedAt") && "anyOf" in schema && Array.isArray(schema.anyOf);
}
function transformDateProperties(schema) {
  if (!isSchemaObject(schema) || typeof schema !== "object" || schema === null) {
    return schema;
  }
  const newSchema = { ...schema };
  Object.entries(newSchema).forEach(([key, value]) => {
    var _a2;
    if (isSchemaObject(value)) {
      if (isDateTimeProperty(key, value)) {
        const dateTimeFormat = (_a2 = value.anyOf) == null ? void 0 : _a2.find(
          (item) => isSchemaObject(item) && item.format === "date-time"
        );
        if (dateTimeFormat) {
          const dateTimeSchema = {
            type: "string",
            format: "date-time",
            default: dateTimeFormat.default
          };
          newSchema[key] = dateTimeSchema;
        }
      } else {
        newSchema[key] = transformDateProperties(value);
      }
    }
  });
  return newSchema;
}
var SwaggerUIRender = (info, version, theme, stringifiedSwaggerOptions, autoDarkMode) => {
  const swaggerOptions = JSON.parse(stringifiedSwaggerOptions);
  if (swaggerOptions.components && swaggerOptions.components.schemas) {
    swaggerOptions.components.schemas = Object.fromEntries(
      Object.entries(swaggerOptions.components.schemas).map(([key, schema]) => [
        key,
        transformDateProperties(schema)
      ])
    );
  }
  const transformedStringifiedSwaggerOptions = JSON.stringify(swaggerOptions);
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${info.title}</title>
    <meta
        name="description"
        content="${info.description}"
    />
    <meta
        name="og:description"
        content="${info.description}"
    />
    ${autoDarkMode && typeof theme === "string" ? `
    <style>
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #222;
                color: #faf9a;
            }
            .swagger-ui {
                filter: invert(92%) hue-rotate(180deg);
            }

            .swagger-ui .microlight {
                filter: invert(100%) hue-rotate(180deg);
            }
        }
    </style>` : ""}
    ${typeof theme === "string" ? `<link rel="stylesheet" href="${theme}" />` : `<link rel="stylesheet" media="(prefers-color-scheme: light)" href="${theme.light}" />
<link rel="stylesheet" media="(prefers-color-scheme: dark)" href="${theme.dark}" />`}
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@${version}/swagger-ui-bundle.js" crossorigin><\/script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle(${transformedStringifiedSwaggerOptions});
        };
    <\/script>
</body>
</html>`;
};
var ScalarRender = (info, version, config, cdn) => {
  var _a2;
  return `<!doctype html>
<html>
  <head>
    <title>${info.title}</title>
    <meta
        name="description"
        content="${info.description}"
    />
    <meta
        name="og:description"
        content="${info.description}"
    />
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
      }
    </style>
    <style>
      ${config.customCss ?? a}
    </style>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="${(_a2 = config.spec) == null ? void 0 : _a2.url}"
      data-configuration='${JSON.stringify(config)}'
    >
    <\/script>
    <script src="${cdn ? cdn : `https://cdn.jsdelivr.net/npm/@scalar/api-reference@${version}/dist/browser/standalone.min.js`}" crossorigin><\/script>
  </body>
</html>`;
};
var Kind = Symbol.for("TypeBox.Kind");
var toOpenAPIPath = (path) => path.split("/").map((x) => {
  if (x.startsWith(":")) {
    x = x.slice(1, x.length);
    if (x.endsWith("?")) x = x.slice(0, -1);
    x = `{${x}}`;
  }
  return x;
}).join("/");
var mapProperties = (name, schema, models) => {
  if (schema === void 0) return [];
  if (typeof schema === "string")
    if (schema in models) schema = models[schema];
    else throw new Error(`Can't find model ${schema}`);
  return Object.entries((schema == null ? void 0 : schema.properties) ?? []).map(([key, value]) => {
    var _a2;
    const {
      type: valueType = void 0,
      description,
      examples,
      ...schemaKeywords
    } = value;
    return {
      // @ts-ignore
      description,
      examples,
      schema: { type: valueType, ...schemaKeywords },
      in: name,
      name: key,
      // @ts-ignore
      required: ((_a2 = schema.required) == null ? void 0 : _a2.includes(key)) ?? false
    };
  });
};
var mapTypesResponse = (types, schema) => {
  if (typeof schema === "object" && ["void", "undefined", "null"].includes(schema.type))
    return;
  const responses = {};
  for (const type2 of types) {
    responses[type2] = {
      schema: typeof schema === "string" ? {
        $ref: `#/components/schemas/${schema}`
      } : { ...schema }
    };
  }
  return responses;
};
var capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
var generateOperationId = (method, paths) => {
  let operationId = method.toLowerCase();
  if (paths === "/") return operationId + "Index";
  for (const path of paths.split("/")) {
    if (path.charCodeAt(0) === 123) {
      operationId += "By" + capitalize(path.slice(1, -1));
    } else {
      operationId += capitalize(path);
    }
  }
  return operationId;
};
var cloneHook = (hook) => {
  if (!hook) return;
  if (typeof hook === "string") return hook;
  if (Array.isArray(hook)) return [...hook];
  return { ...hook };
};
var registerSchemaPath = ({
  schema,
  path,
  method,
  hook,
  models
}) => {
  var _a2;
  hook = cloneHook(hook);
  const contentType = (hook == null ? void 0 : hook.type) ?? [
    "application/json",
    "multipart/form-data",
    "text/plain"
  ];
  path = toOpenAPIPath(path);
  const contentTypes = typeof contentType === "string" ? [contentType] : contentType ?? ["application/json"];
  const bodySchema = cloneHook(hook == null ? void 0 : hook.body);
  const paramsSchema = cloneHook(hook == null ? void 0 : hook.params);
  const headerSchema = cloneHook(hook == null ? void 0 : hook.headers);
  const querySchema = cloneHook(hook == null ? void 0 : hook.query);
  let responseSchema = cloneHook(hook == null ? void 0 : hook.response);
  if (typeof responseSchema === "object") {
    if (Kind in responseSchema) {
      const {
        type: type2,
        properties,
        required,
        additionalProperties,
        patternProperties,
        ...rest
      } = responseSchema;
      responseSchema = {
        "200": {
          ...rest,
          description: rest.description,
          content: mapTypesResponse(
            contentTypes,
            type2 === "object" || type2 === "array" ? {
              type: type2,
              properties,
              patternProperties,
              items: responseSchema.items,
              required
            } : responseSchema
          )
        }
      };
    } else {
      Object.entries(responseSchema).forEach(
        ([key, value]) => {
          if (typeof value === "string") {
            if (!models[value]) return;
            const {
              type: type2,
              properties,
              required,
              additionalProperties: _1,
              patternProperties: _2,
              ...rest
            } = models[value];
            responseSchema[key] = {
              ...rest,
              description: rest.description,
              content: mapTypesResponse(contentTypes, value)
            };
          } else {
            const {
              type: type2,
              properties,
              required,
              additionalProperties,
              patternProperties,
              ...rest
            } = value;
            responseSchema[key] = {
              ...rest,
              description: rest.description,
              content: mapTypesResponse(
                contentTypes,
                type2 === "object" || type2 === "array" ? {
                  type: type2,
                  properties,
                  patternProperties,
                  items: value.items,
                  required
                } : value
              )
            };
          }
        }
      );
    }
  } else if (typeof responseSchema === "string") {
    if (!(responseSchema in models)) return;
    const {
      type: type2,
      properties,
      required,
      additionalProperties: _1,
      patternProperties: _2,
      ...rest
    } = models[responseSchema];
    responseSchema = {
      // @ts-ignore
      "200": {
        ...rest,
        content: mapTypesResponse(contentTypes, responseSchema)
      }
    };
  }
  const parameters = [
    ...mapProperties("header", headerSchema, models),
    ...mapProperties("path", paramsSchema, models),
    ...mapProperties("query", querySchema, models)
  ];
  schema[path] = {
    ...schema[path] ? schema[path] : {},
    [method.toLowerCase()]: {
      ...headerSchema || paramsSchema || querySchema || bodySchema ? { parameters } : {},
      ...responseSchema ? {
        responses: responseSchema
      } : {},
      operationId: ((_a2 = hook == null ? void 0 : hook.detail) == null ? void 0 : _a2.operationId) ?? generateOperationId(method, path),
      ...hook == null ? void 0 : hook.detail,
      ...bodySchema ? {
        requestBody: {
          required: true,
          content: mapTypesResponse(
            contentTypes,
            typeof bodySchema === "string" ? {
              $ref: `#/components/schemas/${bodySchema}`
            } : bodySchema
          )
        }
      } : null
    }
  };
};
var filterPaths = (paths, docsPath, {
  excludeStaticFile = true,
  exclude = []
}) => {
  const newPaths = {};
  const excludePaths = [`/${docsPath}`, `/${docsPath}/json`].map(
    (p) => normalize(p)
  );
  for (const [key, value] of Object.entries(paths))
    if (!exclude.some((x) => {
      if (typeof x === "string") return key === x;
      return x.test(key);
    }) && !excludePaths.includes(key) && !key.includes("*") && (excludeStaticFile ? !key.includes(".") : true)) {
      Object.keys(value).forEach((method) => {
        const schema = value[method];
        if (key.includes("{")) {
          if (!schema.parameters) schema.parameters = [];
          schema.parameters = [
            ...key.split("/").filter(
              (x) => x.startsWith("{") && !schema.parameters.find(
                (params) => params.in === "path" && params.name === x.slice(1, x.length - 1)
              )
            ).map((x) => ({
              schema: { type: "string" },
              in: "path",
              name: x.slice(1, x.length - 1),
              required: true
            })),
            ...schema.parameters
          ];
        }
        if (!schema.responses)
          schema.responses = {
            200: {}
          };
      });
      newPaths[key] = value;
    }
  return newPaths;
};
var swagger = async ({
  provider = "scalar",
  scalarVersion = "latest",
  scalarCDN = "",
  scalarConfig = {},
  documentation = {},
  version = "5.9.0",
  excludeStaticFile = true,
  path = "/swagger",
  exclude = [],
  swaggerOptions = {},
  theme = `https://unpkg.com/swagger-ui-dist@${version}/swagger-ui.css`,
  autoDarkMode = true,
  excludeMethods = ["OPTIONS"],
  excludeTags = []
} = {
  provider: "scalar",
  scalarVersion: "latest",
  scalarCDN: "",
  scalarConfig: {},
  documentation: {},
  version: "5.9.0",
  excludeStaticFile: true,
  path: "/swagger",
  exclude: [],
  swaggerOptions: {},
  autoDarkMode: true,
  excludeMethods: ["OPTIONS"],
  excludeTags: []
}) => {
  const schema = {};
  let totalRoutes = 0;
  if (!version)
    version = `https://unpkg.com/swagger-ui-dist@${version}/swagger-ui.css`;
  const info = {
    title: "Elysia Documentation",
    description: "Development documentation",
    version: "0.0.0",
    ...documentation.info
  };
  const relativePath = path.startsWith("/") ? path.slice(1) : path;
  const app = new Elysia({ name: "@elysiajs/swagger" });
  app.get(path, function documentation2() {
    const combinedSwaggerOptions = {
      url: `/${relativePath}/json`,
      dom_id: "#swagger-ui",
      ...swaggerOptions
    };
    const stringifiedSwaggerOptions = JSON.stringify(
      combinedSwaggerOptions,
      (key, value) => {
        if (typeof value == "function") return void 0;
        return value;
      }
    );
    const scalarConfiguration = {
      spec: {
        ...scalarConfig.spec,
        url: `/${relativePath}/json`
      },
      ...scalarConfig,
      // so we can showcase the elysia theme
      // @ts-expect-error
      _integration: "elysiajs"
    };
    return new Response(
      provider === "swagger-ui" ? SwaggerUIRender(
        info,
        version,
        theme,
        stringifiedSwaggerOptions,
        autoDarkMode
      ) : ScalarRender(info, scalarVersion, scalarConfiguration, scalarCDN),
      {
        headers: {
          "content-type": "text/html; charset=utf8"
        }
      }
    );
  }).get(path === "/" ? "/json" : `${path}/json`, function openAPISchema() {
    var _a2, _b, _c;
    const routes = app.getGlobalRoutes();
    if (routes.length !== totalRoutes) {
      const ALLOWED_METHODS = ["GET", "PUT", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH", "TRACE"];
      totalRoutes = routes.length;
      routes.forEach((route) => {
        var _a3, _b2, _c2;
        if (((_b2 = (_a3 = route.hooks) == null ? void 0 : _a3.detail) == null ? void 0 : _b2.hide) === true) return;
        if (excludeMethods.includes(route.method)) return;
        if (ALLOWED_METHODS.includes(route.method) === false && route.method !== "ALL") return;
        if (route.method === "ALL") {
          ALLOWED_METHODS.forEach((method) => {
            var _a4;
            registerSchemaPath({
              schema,
              hook: route.hooks,
              method,
              path: route.path,
              // @ts-ignore
              models: (_a4 = app.definitions) == null ? void 0 : _a4.type,
              contentType: route.hooks.type
            });
          });
          return;
        }
        registerSchemaPath({
          schema,
          hook: route.hooks,
          method: route.method,
          path: route.path,
          // @ts-ignore
          models: (_c2 = app.definitions) == null ? void 0 : _c2.type,
          contentType: route.hooks.type
        });
      });
    }
    return {
      openapi: "3.0.3",
      ...{
        ...documentation,
        tags: (_a2 = documentation.tags) == null ? void 0 : _a2.filter(
          (tag) => !(excludeTags == null ? void 0 : excludeTags.includes(tag == null ? void 0 : tag.name))
        ),
        info: {
          title: "Elysia Documentation",
          description: "Development documentation",
          version: "0.0.0",
          ...documentation.info
        }
      },
      paths: {
        ...filterPaths(schema, relativePath, {
          excludeStaticFile,
          exclude: Array.isArray(exclude) ? exclude : [exclude]
        }),
        ...documentation.paths
      },
      components: {
        ...documentation.components,
        schemas: {
          // @ts-ignore
          ...(_b = app.definitions) == null ? void 0 : _b.type,
          ...(_c = documentation.components) == null ? void 0 : _c.schemas
        }
      }
    };
  });
  return app;
};
async function extractYouTubeVideo(url, format) {
  try {
    const videoId = extractVideoId(url);
    const videoInfo = await fetchVideoInfo(videoId);
    return {
      title: videoInfo.title,
      description: videoInfo.description,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      formats: parseFormats(videoInfo.formats, format)
    };
  } catch (error2) {
    if (error2 instanceof Error) {
      throw new Error(`Failed to extract YouTube video: ${error2.message}`);
    } else {
      throw new Error("Failed to extract YouTube video: Unknown error");
    }
  }
}
function extractVideoId(url) {
  const regex2 = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex2);
  if (!match) {
    throw new Error("Invalid YouTube URL");
  }
  return match[1];
}
async function fetchVideoInfo(videoId) {
  return {
    title: `Video ${videoId}`,
    description: "Video description",
    duration: 120,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    formats: [
      { quality: "720p", format: "mp4", size: 1024 * 1024 * 50 },
      { quality: "1080p", format: "mp4", size: 1024 * 1024 * 100 }
    ]
  };
}
function parseFormats(formats, requestedFormat) {
  return formats.map((format) => ({
    quality: format.quality,
    format: format.format,
    size: format.size,
    url: `https://example.com/download/${format.quality}`
    // Placeholder
  }));
}
async function extractVideo(request) {
  const { url, format } = request;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return await extractYouTubeVideo(url, format);
  }
  throw new Error("Unsupported platform");
}
new Elysia().use(swagger({
  documentation: {
    info: {
      title: "MDU API",
      description: "Media Download Utility API",
      version: "1.0.0"
    }
  }
})).get("/", ({ path }) => path).post("/hello", "Do you miss me?").post("/extract", async ({ body }) => {
  const result = await extractVideo(body);
  return result;
}, {
  body: t.Object({
    url: t.String(),
    format: t.Optional(t.String())
  }),
  detail: {
    summary: "Extract video information and download options",
    tags: ["Video"]
  }
}).listen(3e3);
console.log("🦊 MDU API is running at http://localhost:3000");
