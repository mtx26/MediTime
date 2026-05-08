export type RouteParamValue = string | string[] | undefined;

export function getFirstRouteParam(value: RouteParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function getFirstRouteParams(params: Record<string, RouteParamValue>) {
  return Object.entries(params).reduce<Record<string, string | undefined>>((acc, [key, value]) => {
    acc[key] = getFirstRouteParam(value);
    return acc;
  }, {});
}
