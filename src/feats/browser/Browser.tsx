import React, { useState, useRef } from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import {
  TouchableOpacity,
  Animated,
  PanResponder,
  StyleSheet,
  View,
} from "react-native";
import { Appbar, Button } from "react-native-paper";
import { SearchBar } from "./SearchBar";
import { A11ySettings } from "../settings/A11ySettings";
import theme from "../../../theme";
import { SettingsState } from "../../store/StoreTypes";
import { useAllyStore } from "../../store/allyStore";

const Browser = () => {
  const { writeSetting } = useAllyStore();
  const [url, setUrl] = useState("https://www.sv-kampen.de/");
  const [showSettings, setShowSettings] = useState(false);
  const webViewRef = useRef<WebView | null>(null);

  //region drawer animation
  const bottomDrawerAnim = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only allow dragging up from the bottom
        return gestureState.dy < 0;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Update the bottomDrawerAnim based on the drag distance
        bottomDrawerAnim.setValue(-gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // If the drawer was not dragged more than 200px, open it
        if (gestureState.dy > -200) {
          Animated.spring(bottomDrawerAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        } else {
          // If the drawer was dragged more than 200px, close it
          closeDrawer();
        }
      },
    })
  ).current;

  const openDrawer = () => {
    Animated.timing(bottomDrawerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();
    setShowSettings(true);
  };

  const closeDrawer = () => {
    Animated.timing(bottomDrawerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: false,
    }).start(() => setShowSettings(false));
  };
  //endregion

  //set initial value for settings
  const handleMessage = (event: WebViewMessageEvent) => {
    const eventState = JSON.parse(
      event.nativeEvent.data
    ) as Partial<SettingsState>;
    if (!eventState.initialValue) {
      writeSetting({
        initialValue: eventState.initialValue,
        settingsKey: eventState.settingsKey,
      });
    }
  };

  return (
    <>
      {/*Searchbar*/}
      <Appbar.Header>
        <TouchableOpacity onPress={showSettings ? closeDrawer : openDrawer}>
          <Appbar.Action icon="menu" />
        </TouchableOpacity>
        <SearchBar setUrl={setUrl} url={url} />
      </Appbar.Header>

      {/*WebView*/}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={(event) => handleMessage(event)}
      />

      {/*Settings*/}
      {showSettings && (
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [
                {
                  translateY: bottomDrawerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [200, 0],
                    //clamp: if the input value goes beyond the specified inputRange, the output value will be clamped to the nearest output range value.
                    extrapolate: "clamp",
                  }),
                },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <A11ySettings webViewRef={webViewRef} />
          <View style={{ padding: 16 }}>
            <Button onPress={closeDrawer}>Close Menu</Button>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  drawer: {
    color: theme.colors.primary,
    backgroundColor: theme.colors.secondary,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
  },
});
export default Browser;
