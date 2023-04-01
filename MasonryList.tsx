import React from "react";
import { View } from "react-native";
import styled from "styled-components/native";

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
`;

const Column = styled.View`
  width: 50%;
`;

export default MasonryList;
