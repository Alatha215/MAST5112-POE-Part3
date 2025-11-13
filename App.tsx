import React, { useMemo, useState } from "react";
import {View, Text,  TextInput,FlatList,Pressable,Alert,KeyboardAvoidingView,Platform,ScrollView,StyleSheet,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

type Course = "Starter" | "Main" | "Dessert" | "Drink";

type MenuItem = {
  id: string;            
  name: string;         
  description: string;   
  ingredients: string[]; 
  price: number;
  course: Course;        
};

const INGREDIENT_OPTIONS = ["Cheese", "Pepparoni", "Black pepper", "Basil"] as const;

export default function App() {
  const [screen, setScreen] = useState<"Home" | "Add" | "Filter" | "Average">("Home");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [filterCourse, setFilterCourse] = useState<Course | "All">("All");

  const totalMenuItems = menu.length;

  const averagePricesByCourse = useMemo(() => {
    const averages: Partial<Record<Course, number>> = {};
    const courses: Course[] = ["Starter", "Main", "Dessert", "Drink"];
    
    courses.forEach(course => {
      const courseItems = menu.filter(item => item.course === course);
      if (courseItems.length > 0) {
        const total = courseItems.reduce((sum, item) => sum + item.price, 0);
        averages[course] = total / courseItems.length;
      } else {
        averages[course] = 0;
      }
    });
    
    return averages;
  }, [menu]);

  const NavBar = () => (
    <View style={styles.nav}>
      <NavIcon
        icon="home"
        label="Home"
        active={screen === "Home"}
        onPress={() => setScreen("Home")}
      />
      <NavIcon
        icon="add-circle"
        label="Add"
        active={screen === "Add"}
        onPress={() => setScreen("Add")}
      />
      <NavIcon
        icon="filter"
        label="Filter"
        active={screen === "Filter"}
        onPress={() => setScreen("Filter")}
      />
      <NavIcon
        icon="stats-chart"
        label="Avg"
        active={screen === "Average"}
        onPress={() => setScreen("Average")}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <NavBar />
      <View style={{ flex: 1 }}>
        {screen === "Home" && (
          <HomeScreen
            menu={menu}
            totalMenuItems={totalMenuItems}
            averagePricesByCourse={averagePricesByCourse}
            onRemoveItem={(id) =>
              setMenu((prev) => prev.filter((m) => m.id !== id))
            }
          />
        )}

        {screen === "Add" && (
          <AddItemScreen
            onAdd={(item) => setMenu((prev) => [item, ...prev])}
            menu={menu}
            onRemoveItem={(id) => setMenu((prev) => prev.filter((m) => m.id !== id))}
          />
        )}

        {screen === "Filter" && (
          <FilterScreen
            menu={menu}
            filterCourse={filterCourse}
            onChangeCourse={setFilterCourse}
          />
        )}

        {screen === "Average" && <AveragePriceScreen averagePricesByCourse={averagePricesByCourse} />}
      </View>
    </View>
  );
}

const Header = () => {
  return (
    <View style={styles.header}>
      <View style={styles.logoPlaceholder}>
        <Ionicons name="restaurant" size={32} color="#2a6dcf" />
      </View>
      <View>
        <Text style={styles.title}>Chef Chris'Diner</Text>
        <Text style={styles.subtitle}>Chef's edge, every plate</Text>
      </View>
    </View>
  );
};

function NavIcon({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.navItem, active && styles.navItemActive]}
    >
      <Ionicons 
        name={icon} 
        size={24} 
        color={active ? "#2a6dcf" : "#666"} 
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function HomeScreen({
  menu,
  totalMenuItems,
  averagePricesByCourse,
  onRemoveItem,
}: {
  menu: MenuItem[];
  totalMenuItems: number;
  averagePricesByCourse: Partial<Record<Course, number>>;
  onRemoveItem: (id: string) => void;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.statsRow}>
        <StatCard label="Menu items" value={String(totalMenuItems)} />
      </View>

      <View style={styles.averageSection}>
        <Text style={styles.averageHeader}>Average Prices by Course</Text>
        <View style={styles.averageGrid}>
          {(["Starter", "Main", "Dessert", "Drink"] as Course[]).map((course) => (
            <View key={course} style={styles.averageItem}>
              <Text style={styles.averageCourse}>{course}</Text>
              <Text style={styles.averagePrice}>
                R {averagePricesByCourse[course]?.toFixed(2) || "0.00"}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {menu.length === 0 ? (
        <EmptyState
          title="No menu yet"
          message="Add your first dish from the Add screen."
        />
      ) : (
        <FlatList
          data={menu}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCourse}>{item.course}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardIngredients}>
                  Ingredients: {item.ingredients.join(", ")}
                </Text>
                <Text style={styles.cardPrice}>
                  Price: R {item.price.toFixed(2)}
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Remove item",
                    `Delete "${item.name}" from the menu?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => onRemoveItem(item.id),
                      },
                    ]
                  )
                }
                style={styles.deleteBtn}
              >
                <Ionicons name="trash" size={20} color="#666" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

function AddItemScreen({ 
  onAdd, 
  menu, 
  onRemoveItem 
}: { 
  onAdd: (item: MenuItem) => void;
  menu: MenuItem[];
  onRemoveItem: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [course, setCourse] = useState<Course>("Starter");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [priceText, setPriceText] = useState("");

  const toggleIngredient = (ing: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(ing)) return prev.filter((x) => x !== ing);
      if (prev.length >= 4) {
        Alert.alert("Limit reached", "You can select up to 4 ingredients.");
        return prev;
      }
      return [...prev, ing];
    });
  };

  const clearForm = () => {
    setName("");
    setDesc("");
    setCourse("Starter");
    setSelectedIngredients([]);
    setPriceText("");
  };

  const handleAdd = () => {
    const price = Number(priceText);

    if (!name.trim()) return Alert.alert("Validation", "Please enter a name.");
    if (!desc.trim()) return Alert.alert("Validation", "Please enter a description.");
    if (selectedIngredients.length === 0) return Alert.alert("Validation", "Please select at least one ingredient.");
    if (Number.isNaN(price) || price <= 0) return Alert.alert("Validation", "Please enter a valid price (number > 0).");

    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: name.trim(),
      description: desc.trim(),
      course,
      ingredients: selectedIngredients,
      price,
    };

    onAdd(newItem);
    clearForm();
    Alert.alert("Saved", "Menu item added to Home.");
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove "${itemName}" from the menu?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => onRemoveItem(itemId)
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.formHeading}>Insert a Menu Item</Text>

        <Text style={styles.label}>Dish Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Bone Marrow"
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={desc}
          onChangeText={setDesc}
          placeholder="Short description..."
          style={[styles.input, { height: 80 }]}
          multiline
        />

        <Text style={styles.label}>Course</Text>
        <View style={styles.courseRow}>
          {(["Starter", "Main", "Dessert", "Drink"] as Course[]).map((c) => {
            const active = course === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCourse(c)}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: "#2a6dcf",
                    borderColor: "#2a6dcf",
                  },
                ]}
              >
                <Text style={[styles.pillText, active && { color: "#fff" }]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Select up to 4 Ingredients</Text>
        <View style={styles.ingredientsWrap}>
          {INGREDIENT_OPTIONS.map((ing) => {
            const active = selectedIngredients.includes(ing);
            return (
              <Pressable
                key={ing}
                onPress={() => toggleIngredient(ing)}
                style={[
                  styles.ingredientChip,
                  active && {
                    backgroundColor: "#e8f0ff",
                    borderColor: "#2a6dcf",
                  },
                ]}
              >
                <Ionicons
                  name={active ? "checkbox" : "square-outline"}
                  size={18}
                  color={active ? "#2a6dcf" : "#666"}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.ingredientText}>{ing}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Price (Rands)</Text>
        <TextInput
          value={priceText}
          onChangeText={setPriceText}
          placeholder="e.g., 89.99"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Pressable onPress={handleAdd} style={styles.primaryBtn}>
          <Ionicons name="save" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Add to Menu</Text>
        </Pressable>

        {menu.length > 0 && (
          <>
            <Text style={styles.currentItemsHeader}>Current Menu Items</Text>
            <View style={styles.currentItemsList}>
              {menu.map((item) => (
                <View key={item.id} style={styles.currentItemRow}>
                  <View style={styles.currentItemInfo}>
                    <Text style={styles.currentItemName}>{item.name}</Text>
                    <Text style={styles.currentItemDetails}>
                      {item.course} • R {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.removeItemBtn}
                    onPress={() => handleRemoveItem(item.id, item.name)}
                  >
                    <Ionicons name="trash" size={16} color="#dc3545" />
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FilterScreen({
  menu,
  filterCourse,
  onChangeCourse,
}: {
  menu: MenuItem[];
  filterCourse: Course | "All";
  onChangeCourse: (c: Course | "All") => void;
}) {
  const filtered = useMemo(() => {
    if (filterCourse === "All") return menu;
    return menu.filter(item => item.course === filterCourse);
  }, [menu, filterCourse]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={styles.formHeading}>Filter by Course</Text>

        <View style={styles.courseRow}>
          {(["All", "Starter", "Main", "Dessert", "Drink"] as const).map((c) => {
            const active = filterCourse === c;
            return (
              <Pressable
                key={c}
                onPress={() => onChangeCourse(c)}
                style={[
                  styles.pill,
                  active && {
                    backgroundColor: "#2a6dcf",
                    borderColor: "#2a6dcf",
                  },
                ]}
              >
                <Text style={[styles.pillText, active && { color: "#fff" }]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          title="No results"
          message="Try a different course or add items from the Add screen."
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardCourse}>{item.course}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
                <Text style={styles.cardIngredients}>
                  Ingredients: {item.ingredients.join(", ")}
                </Text>
                <Text style={styles.cardPrice}>
                  Price: R {item.price.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function AveragePriceScreen({ 
  averagePricesByCourse 
}: { 
  averagePricesByCourse: Partial<Record<Course, number>>;
}) {
  const courses: Course[] = ["Starter", "Main", "Dessert", "Drink"];

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.formHeading}>Average Price by Course</Text>

      {courses.every(course => averagePricesByCourse[course] === 0) ? (
        <EmptyState
          title="No data yet"
          message="Add some menu items first, then come back to see averages."
        />
      ) : (
        <View>
          {courses.map((course) => (
            <View key={course} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{course}</Text>
                <Text style={styles.cardPrice}>
                  Average Price: R {averagePricesByCourse[course]?.toFixed(2) || "0.00"}
                </Text>
                <Text style={styles.cardDesc}>
                  {averagePricesByCourse[course] 
                    ? `Average of all ${course.toLowerCase()} items` 
                    : `No ${course.toLowerCase()} items yet`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.emptyWrap}>
      <Ionicons name="restaurant" size={48} color="#2a6dcf" style={{ marginBottom: 8 }} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f7f9" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#e8f0ff",
    gap: 12,
  },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a6dcf",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#2a6dcf" },
  subtitle: { fontSize: 12, color: "#4a86e8" },

  nav: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#c8d8f0",
    backgroundColor: "#fff",
  },
  navItem: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  navItemActive: { backgroundColor: "#e8f0ff" },
  navLabel: { fontSize: 12, marginTop: 4, color: "#666" },
  navLabelActive: { fontWeight: "700", color: "#2a6dcf" },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dce4f0",
  },
  statLabel: { fontSize: 12, color: "#607d8b" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#2a6dcf", marginTop: 4 },


  averageSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dce4f0",
  },
  averageHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2a6dcf",
    marginBottom: 12,
    textAlign: "center",
  },
  averageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  averageItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8faff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e8f0ff",
  },
  averageCourse: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  averagePrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2a6dcf",
  },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#dce4f0",
    marginTop: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#263238" },
  cardCourse: { fontSize: 12, color: "#2a6dcf", marginTop: 2 },
  cardDesc: { fontSize: 13, color: "#546e7a", marginTop: 6 },
  cardIngredients: { fontSize: 12, color: "#37474f", marginTop: 8 },
  cardPrice: { fontSize: 14, fontWeight: "700", color: "#2a6dcf", marginTop: 8 },
  deleteBtn: {
    height: 36,
    width: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd8e8",
    alignSelf: "flex-start",
  },

  formHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: "#2a6dcf",
    marginBottom: 12,
  },
  label: { fontSize: 12, color: "#607d8b", marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#cfd8e8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  courseRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cfd8e8",
    backgroundColor: "#fff",
  },
  pillText: { fontSize: 13, color: "#37474f" },

  ingredientsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  ingredientChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfd8e8",
    backgroundColor: "#fff",
  },
  ingredientText: { fontSize: 13, color: "#37474f" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#2a6dcf",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  currentItemsHeader: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2a6dcf",
    marginTop: 24,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 16,
  },
  currentItemsList: {
    gap: 8,
  },
  currentItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8faff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8f0ff",
  },
  currentItemInfo: {
    flex: 1,
  },
  currentItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
  },
  currentItemDetails: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  removeItemBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#f8d7da",
  },

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 16, fontWeight: "800", color: "#2a6dcf", marginTop: 8 },
  emptyMsg: { fontSize: 13, color: "#607d8b", textAlign: "center", marginTop: 6 },
});