import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import Pinterest from "./Pinterest";

export default function App() {
  return (
    <View style={styles.container}>
      <Pinterest />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
