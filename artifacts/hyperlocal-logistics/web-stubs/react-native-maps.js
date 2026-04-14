// Web stub for react-native-maps
// Maps are native-only; on web we render a placeholder instead

const React = require("react");
const { View, Text } = require("react-native");

const noop = () => null;

const MapView = React.forwardRef(function MapView({ children, style }, ref) {
  return React.createElement(View, { style }, children);
});

const Marker = noop;
const Polyline = noop;
const Circle = noop;
const Callout = noop;

const PROVIDER_DEFAULT = null;
const PROVIDER_GOOGLE = "google";

module.exports = {
  default: MapView,
  MapView,
  Marker,
  Polyline,
  Circle,
  Callout,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
};
