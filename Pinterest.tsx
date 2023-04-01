import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Dimensions,
  Image,
  GestureResponderEvent,
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
import MasonryList from "./MasonryList";
import styled from "styled-components/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height: deviceHeight } = Dimensions.get("screen");

const height = deviceHeight;

const AnimatedFastImage = Animated.createAnimatedComponent(Image);

interface StackItem {
  url: string;
  aspectRatio: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const images = [
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
].map((x) => ({
  url: x,
  aspectRatio:
    Image.resolveAssetSource(x).width / Image.resolveAssetSource(x).height,
}));

let c = 0;
const getImage = () => {
  return images[c++ % images.length];
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
        ...url,
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
    const image = getImage();

    setStack([
      {
        url: image.url,
        aspectRatio: image.aspectRatio,
      },
    ]);
  }, []);

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
  scrollY: globalScrollY,
  data,
  onClickItem,
  onPop,
}: ImageStackScreenProps) => {
  const ref = useRef();
  const mainImageRef = useRef();
  const fade = useSharedValue(0);
  const slideBackX = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const direction = useSharedValue<"forward" | "backward">("forward");
  const [target, setTarget] = useState({});
  const safeArea = useSafeAreaInsets();

  const subImages = useMemo(() => {
    return range(24).map((x) => {
      const image = getImage();
      return {
        url: image.url,
        aspectRatio: image.aspectRatio,
      };
    });
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
        globalScrollY.value = y;
      }
    },
    onBeginDrag: (event, context) => {
      if (stack.length === 1) {
        return false;
      }

      context.enabled = true;
    },
    onEndDrag: (event, context) => {
      context.enabled = false;

      if (scrollY.value < 0) {
        if (scrollY.value < -50) {
          runOnJS(pop)();
        } else {
          scrollX.value = withSpring(0);
          scrollY.value = withSpring(0);
        }
        globalScrollY.value = withSpring(0);
      }
    },
  });

  console.log(subImages);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.enabled = true;
      context.startX = event.x;
    },
    onFinish: (event, context) => {
      slideBackX.value = 0;
    },
    onActive: (event, context) => {
      const dx = context.startX - event.x;

      if (!context.enabled) {
        return false;
      }

      scrollX.value = event.translationX;

      if (context.startX <= 30) {
        slideBackX.value = event.translationX;

        if (dx <= -75) {
          context.enabled = false;

          runOnJS(pop)();
        }
      }
    },
  });

  const handlePress = (e: GestureResponderEvent, index: number) => {
    direction.value = "forward";
    e.target.measure((x, y, w, h, pageX, pageY) => {
      setTarget({ index, x: pageX, y: pageY, w, h });

      console.log(pageY);

      fade.value = withTiming(1, {
        duration: 550,
        easing: Easing.out(Easing.exp),
      });

      console.log("click", index);

      setTimeout(() => {
        onClickItem(subImages[index], pageX, pageY, w, h);
      }, 550);
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
              scale: 1 + fade.value + 60 / width,
            },
            {
              translateX: interpolate(
                fade.value,
                [0, 1],
                [0, -(target.x - (width + 30) / 4)],
                Extrapolate.CLAMP
              ),
            },
            {
              translateY: interpolate(
                fade.value,
                [0, 1],
                [0, -(target.y - height / 4) + safeArea.top],
                Extrapolate.CLAMP
              ),
            },
          ],
        };
      } else {
        // fade 1 -> 0
        console.log("hii", fade.value);
        return {
          opacity: interpolate(fade.value, [1, 0], [1, 1], Extrapolate.CLAMP),
          transform: [
            {
              scale: interpolate(
                fade.value,
                [1, 0],
                [1.09, 1],
                Extrapolate.CLAMP
              ),
            },
          ],
        };
      }
    }

    if (Math.abs(index - stack.length) >= 3) {
      return { opacity: 0 };
    }

    return {
      opacity: active
        ? 1
        : interpolate(
            globalScrollY.value,
            [-200, 0],
            [0.65, 0],
            Extrapolate.CLAMP
          ),
      transform: active
        ? [
            { scale: Math.max(0.8, (200 + scrollY.value) * 0.005) },
            { translateX: scrollY.value < 0 ? scrollX.value * 0.5 : 0 },

            ...(slideBackX.value > 0
              ? [
                  { perspective: width },
                  {
                    rotateY:
                      interpolate(
                        slideBackX.value,
                        [0, 70],
                        [0, 7],
                        Extrapolate.CLAMP
                      ) + "deg",
                  },
                  {
                    translateX: interpolate(
                      slideBackX.value,
                      [0, 70],
                      [0, 50],
                      Extrapolate.CLAMP
                    ),
                  },
                ]
              : []),
          ]
        : [
            {
              scale: interpolate(
                globalScrollY.value,
                [-200, 0],
                [1, 1.1],
                Extrapolate.CLAMP
              ),
            },
          ],
    };
  }, [target, active, stack]);

  const topImageStyle = useAnimatedStyle(() => {
    return {
      borderRadius: active
        ? interpolate(scrollY.value, [-200, 0], [80, 45], Extrapolate.CLAMP)
        : 45,
    };
  });

  const masonryListStyle = useAnimatedStyle(() => {
    return {
      zIndex: -1,
      opacity: active
        ? interpolate(scrollY.value, [-100, 0], [0, 1], Extrapolate.CLAMP) **
            4 *
          interpolate(slideBackX.value, [0, 70], [1, 0], Extrapolate.CLAMP)
        : 1,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [-100, 0],
            [-500, 0],
            Extrapolate.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollY.value,
            [-100, 0],
            [0.8, 1],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const activeImageStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  const inactiveImageStyle = useAnimatedStyle(() => {
    return {
      opacity: active
        ? direction.value === "forward"
          ? 1 - fade.value
          : interpolate(fade.value, [0, 1], [1, 0.35], Extrapolate.CLAMP)
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
          <Animated.ScrollView
            scrollEventThrottle={1}
            showsVerticalScrollIndicator={false}
            style={[{ flex: 1, overflow: "visible" }, style]}
            onScroll={scrollHandler}
          >
            <AnimatedFastImage
              ref={mainImageRef}
              source={data.url}
              resizeMode="cover"
              style={[
                {
                  width: width,
                  height: width * (1 / Math.min(1, data.aspectRatio)),
                },
                topImageStyle,
                direction.value === "forward" &&
                !isNil(target.index) &&
                target.index !== index
                  ? inactiveImageStyle
                  : activeImageStyle,
              ]}
            />

            <MasonryList style={masonryListStyle}>
              {subImages.map(({ url, aspectRatio }, index) => (
                <ListItem
                  key={index}
                  fade={fade}
                  scrollY={scrollY}
                  direction={direction}
                  stack={stack}
                  active={active}
                  activeIndex={target.index}
                  index={index}
                  url={url}
                  aspectRatio={aspectRatio}
                  onPress={(e) => handlePress(e, index)}
                />
              ))}
            </MasonryList>
          </Animated.ScrollView>
        </NativeViewGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
};

interface ListItemProps {
  stack: any[];
  fade: SharedValue<number>;
  scrollY: SharedValue<number>;
  direction: SharedValue<"forward" | "backward">;
  active: boolean;
  activeIndex: number | undefined;
  index: number;
  url: string;
  aspectRatio: number;
  onPress: (e: GestureResponderEvent) => void;
}
const ListItem = ({
  stack,
  fade,
  scrollY,
  direction,
  active,
  activeIndex,
  index,
  url,
  aspectRatio,
  onPress,
}: ListItemProps) => {
  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: active
        ? [
            {
              translateY: interpolate(
                scrollY.value,
                [-200, 0],
                [-200 - index * 200, 0],
                Extrapolate.CLAMP
              ),
            },
            {
              translateX: interpolate(
                scrollY.value,
                [-200, 0],
                [index % 2 ? -200 : 200, 0],
                Extrapolate.CLAMP
              ),
            },
            {
              scale: interpolate(
                scrollY.value,
                [-200, 0],
                [0.5, 1],
                Extrapolate.CLAMP
              ),
            },
          ]
        : [],
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
          ? interpolate(fade.value, [1, 0], [45, 10], Extrapolate.CLAMP)
          : 20,
      transform:
        direction.value === "backward"
          ? [
              {
                translateX: interpolate(
                  fade.value,
                  [1, 0],
                  [top.x2 - top.x + width / 5, 0],
                  Extrapolate.CLAMP
                ),
              },
              {
                translateY: interpolate(
                  fade.value,
                  [1, 0],
                  [top.y2 - top.y + height / 7, 0],
                  Extrapolate.CLAMP
                ),
              },
              {
                scale: interpolate(
                  fade.value,
                  [1, 0],
                  [top.w2 / (width / 2), 1],
                  Extrapolate.CLAMP
                ),
              },
            ]
          : [],
    };
  });

  const activeImageStyle = useAnimatedStyle(() => {
    return {
      opacity: 1,
    };
  });

  const inactiveImageStyle = useAnimatedStyle(() => {
    return {
      opacity: active
        ? direction.value === "forward"
          ? 1 - fade.value
          : interpolate(fade.value, [0, 1], [1, 0.35], Extrapolate.CLAMP)
        : 1,
    };
  });

  return (
    <ImageItem
      style={{
        width: "100%",
        aspectRatio: Math.min(1, aspectRatio), //(width * 1.75) / 2,
      }}
      onPress={onPress}
    >
      <Animated.View style={[containerStyle, { flex: 1 }]}>
        <AnimatedFastImage
          source={url}
          resizeMode="cover"
          style={[
            { backgroundColor: "rgba(64,64,64, 0.6)" },
            { width: "100%", height: "100%", borderRadius: 10 }, //(width * 1.75) / 2 },

            !isNil(activeIndex) && activeIndex !== index
              ? inactiveImageStyle
              : activeImageStyle,

            activeIndex === index && flyImageStyle,

            activeIndex === index && !active && { opacity: 0 },
          ]}
        />
      </Animated.View>
    </ImageItem>
  );
};

const ImageItem = styled.Pressable`
  background: black;
`;

export default Pinterest;
