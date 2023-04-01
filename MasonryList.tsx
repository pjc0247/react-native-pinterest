import React from "react";
import { Dimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import styled from "styled-components/native";

const { width } = Dimensions.get("window");

const Gap = 10;

export interface MasonryListProps {
  children: React.ReactNode;
}
const MasonryList = ({ children, ...props }: MasonryListProps) => {
  return (
    <Container {...props}>
      <Column>
        {React.Children.map(children, (x, index) => index % 2 === 0 && x)}
      </Column>
      <Column>
        {React.Children.map(children, (x, index) => index % 2 === 1 && x)}
      </Column>
    </Container>
  );
};

const Container = styled(Animated.View)`
  width: 100%;

  flex-direction: row;

  background: black;

  gap: ${Gap}px;
  padding: ${Gap}px;
`;

const Column = styled.View`
  width: ${width / 2 - Gap * 1.5}px;

  gap: ${Gap}px;
`;

export default MasonryList;
