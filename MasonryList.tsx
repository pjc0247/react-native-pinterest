import React from "react";
import { Dimensions, View } from "react-native";
import styled from "styled-components/native";

const { width } = Dimensions.get("window");

const Gap = 10;

export interface MasonryListProps {
  children: React.ReactNode;
}
const MasonryList = ({ children }: MasonryListProps) => {
  return (
    <Container>
      <Column>
        {React.Children.map(children, (x, index) => index % 2 === 0 && x)}
      </Column>
      <Column>
        {React.Children.map(children, (x, index) => index % 2 === 1 && x)}
      </Column>
    </Container>
  );
};

const Container = styled.View`
  width: 100%;

  flex-direction: row;

  gap: ${Gap}px;
  padding: ${Gap}px;
`;

const Column = styled.View`
  width: ${width / 2 - Gap * 1.5}px;

  gap: ${Gap}px;
`;

export default MasonryList;
