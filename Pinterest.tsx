import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Dimensions,
  GestureResponderEvent,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import {
  NativeViewGestureHandler,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolate,
  SharedValue,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { range, isNil } from "lodash-es";

const { width, height } = Dimensions.get("screen");

const AnimatedFastImage = Animated.createAnimatedComponent(Image);

interface StackItem {
  url: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

let c = 0;
const getImage = () => {
  return [
    require("./assets/1.jpg"),
    require("./assets/2.jpg"),
    require("./assets/3.jpg"),
    require("./assets/4.jpg"),
    require("./assets/5.jpg"),
    require("./assets/6.jpg"),
    require("./assets/7.jpg"),
    require("./assets/8.jpg"),
    require("./assets/9.jpg"),
    require("./assets/10.jpg"),
    require("./assets/11.jpg"),
    require("./assets/12.jpg"),
    require("./assets/13.jpg"),
    require("./assets/14.jpg"),
    require("./assets/15.jpg"),
  ][c++ % 15];
};

const Pinterest = () => {
  const [stack, setStack] = useState<StackItem[]>([]);
  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const onPushStack = (
    url: string,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    console.log(x, y, w, h);

    stack[stack.length - 1] = {
      ...stack[stack.length - 1],
      x,
      y,
      w,
      h,
    };

    setStack([
      ...stack,
      {
        x,
        y,
        w,
        h,
        url,
      },
    ]);
  };

  const onPopStack = (x: number, y: number, w: number, h: number) => {
    const newStack = stack.slice(0, stack.length - 1);

    newStack[newStack.length - 1] = {
      ...newStack[newStack.length - 1],
      x2: x,
      y2: y,
      w2: w,
      h2: h,
    };

    setStack([...newStack]);
  };

  useEffect(() => {
    setStack([
      {
        url: getImage(),
      },
    ]);
  }, []);

  console.log("ss", stack.length);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {stack.map((x, index) => (
        <View key={index} style={StyleSheet.absoluteFill}>
          <ImageStackScreen
            index={index}
            active={index === stack.length - 1}
            stack={stack}
            scrollX={scrollX}
            scrollY={scrollY}
            data={x}
            onClickItem={onPushStack}
            onPop={onPopStack}
          />
        </View>
      ))}
    </View>
  );
};

interface ImageStackScreenProps {
  index: number;
  active: boolean;
  stack: StackItem[];
  scrollX: SharedValue<number>;
  scrollY: SharedValue<number>;
  data: StackItem;
  onClickItem: () => void;
  onPop: () => void;
}
const ImageStackScreen = ({
  index,
  active,
  stack,
  scrollX,
  scrollY,
  data,
  onClickItem,
  onPop,
}: ImageStackScreenProps) => {
  const ref = useRef();
  const mainImageRef = useRef();
  const fade = useSharedValue(0);
  const direction = useSharedValue<"forward" | "backward">("forward");
  const [target, setTarget] = useState({});

  const subImages = useMemo(() => {
    return range(12).map((x) => getImage());
  }, []);

  const pop = () => {
    console.log("pop");
    mainImageRef.current.measure((x, y, w, h, pageX, pageY) => {
      console.log(pageX, pageY);

      onPop(pageX, pageY, w, h);
    });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event, context) => {
      const { y } = event.contentOffset;

      if (!context.enabled) {
        return;
      }

      if (y < 0) {
        console.log("sescrolly");
        scrollY.value = y;
      }
    },
    onBeginDrag: (event, context) => {
      context.enabled = true;
    },
    onEndDrag: (event, context) => {
      context.enabled = false;

      if (scrollY.value < -50) {
        runOnJS(pop)();
      }

      scrollX.value = withSpring(0);
      scrollY.value = withSpring(0);
    },
  });

  console.log(scrollY.value);

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      scrollX.value = event.translationX;
    },
  });

  const handlePress = (e: GestureResponderEvent, index: number) => {
    direction.value = "forward";
    e.target.measure((x, y, w, h, pageX, pageY) => {
      setTarget({ index, x: pageX, y: pageY, w, h });

      console.log(pageY);

      fade.value = withTiming(1, {
        duration: 450,
        easing: Easing.inOut(Easing.cubic),
      });

      console.log("click", index);

      setTimeout(() => {
        onClickItem(subImages[index], pageX, pageY, w, h);
      }, 450);
    });
  };

  const style = useAnimatedStyle(() => {
    if (fade.value > 0 && active) {
      if (direction.value === "forward") {
        // fade 0 -> 1
        return {
          opacity: 1,
          transform: [
            {
              scale: 1 + fade.value,
            },
            {
              translateX: interpolate(
                fade.value,
                [0, 1],
                [0, -(target.x - width / 4)]
              ),
            },
            {
              translateY: interpolate(
                fade.value,
                [0, 1],
                [0, -(target.y - height / 4)]
              ),
            },
          ],
        };
      } else {
        // fade 1 -> 0
        console.log("hii", fade.value);
        return {
          opacity: interpolate(fade.value, [1, 0], [1, 1]),
          transform: [{ scale: interpolate(fade.value, [1, 0], [1.09, 1]) }],
        };
      }
    }

    if (Math.abs(index - stack.length) >= 3) {
      return { opacity: 0 };
    }

    return {
      opacity: active ? 1 : interpolate(scrollY.value, [-200, 0], [0.35, 0.18]),
      transform: active
        ? [
            { scale: Math.max(0.8, (200 + scrollY.value) * 0.005) },
            { translateX: scrollY.value < 0 ? scrollX.value * 0.5 : 0 },
          ]
        : [{ scale: interpolate(scrollY.value, [-200, 0], [1, 1.09]) }],
    };
  }, [target, active, stack]);

  const topImageStyle = useAnimatedStyle(() => {
    return {
      borderRadius: active ? interpolate(scrollY.value, [-200, 0], [45, 0]) : 1,
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      opacity: active ? interpolate(scrollY.value, [-100, 0], [0, 1]) : 1,
    };
  });

  const flyImageStyle = useAnimatedStyle(() => {
    const top = stack[stack.length - 1];

    console.log("TT", top.x2 - top.x);

    const f = top.w2 / (width / 2);

    return {
      zIndex: 1,
      borderRadius:
        direction.value === "backward"
          ? interpolate(fade.value, [1, 0], [45, 0])
          : 0,
      transform:
        direction.value === "backward"
          ? [
              {
                translateX: interpolate(
                  fade.value,
                  [1, 0],
                  [top.x2 - top.x + width / 5, 0]
                ),
              },
              {
                translateY: interpolate(
                  fade.value,
                  [1, 0],
                  [top.y2 - top.y + height / 7, 0]
                ),
              },
              {
                scale: interpolate(
                  fade.value,
                  [1, 0],
                  [top.w2 / (width / 2), 1]
                ),
              },
            ]
          : [],
    };
  });

  const inactiveImageStyle = useAnimatedStyle(() => {
    return {
      opacity: active
        ? direction.value === "forward"
          ? 1 - fade.value
          : interpolate(fade.value, [0, 1], [1, 0.35])
        : 1,
    };
  });

  useEffect(() => {
    if (active && fade.value === 1) {
      direction.value = "backward";
      fade.value = withTiming(0, {
        duration: 600,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [active]);

  return (
    <PanGestureHandler
      simultaneousHandlers={ref}
      onGestureEvent={gestureHandler}
    >
      <Animated.View style={{ flex: 1 }}>
        <NativeViewGestureHandler ref={ref}>
          <Animated.FlatList
            ListHeaderComponent={
              <AnimatedFastImage
                ref={mainImageRef}
                source={data.url}
                defaultSource={data.url}
                style={[
                  { width: "100%", height: width * 1.75 },
                  topImageStyle,
                  direction.value === "forward" &&
                  !isNil(target.index) &&
                  target.index !== index
                    ? inactiveImageStyle
                    : { opacity: 1 },
                ]}
              />
            }
            scrollEventThrottle={1}
            showsVerticalScrollIndicator={false}
            style={[{ flex: 1, overflow: "visible" }, style]}
            numColumns={2}
            data={subImages}
            renderItem={({ item, index }) => (
              <Pressable
                style={{ flex: 1, height: (width * 1.75) / 2 }}
                onPress={(e) => handlePress(e, index)}
              >
                <Animated.View style={[{ flex: 1 }, imageStyle]}>
                  <AnimatedFastImage
                    source={item}
                    defaultSource={item}
                    resizeMode="cover"
                    style={[
                      { width: width / 2, height: (width * 1.75) / 2 },

                      !isNil(target.index) && target.index !== index
                        ? inactiveImageStyle
                        : { opacity: 1 },

                      target.index === index && flyImageStyle,
                    ]}
                  />
                </Animated.View>
              </Pressable>
            )}
            onScroll={scrollHandler}
          />
        </NativeViewGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default Pinterest;
