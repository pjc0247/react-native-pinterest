import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import Pinterest from "./Pinterest";

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top"]} style={styles.container}>
        <Pinterest />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});
