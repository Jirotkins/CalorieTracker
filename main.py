import json

def safe_number_input(question):
    try:
        safe_number = int(input(question))
    except ValueError:
        print("Toto není číslo!")
        safe_number = safe_number_input(question)
    return safe_number

class FoodItem:
    def __init__(self, name, calories):
        self.name = name
        self.calories = calories

class CalorieTracker:
    def __init__(self, user_name, daily_goal):
        self.user_name = user_name
        self.daily_goal = daily_goal
        self.meals = []
        self.calories_eaten = 0

    def add_meal(self, food_item):
        self.meals.append(food_item)
        self.calories_eaten += food_item.calories

name = input("Jak se jmenujete?: ")
daily_calories_goal = safe_number_input(("Jaký je váš denní cíl kalorií?: "))

tracker = CalorieTracker(name, daily_calories_goal)

# try:
#     with open("todays_meals", "r", encoding="utf-8") as file:
#         meals = json.load(file)
#         for meal in meals:
#             calories_eaten += meal["calories"]
# except FileNotFoundError:
#     pass

while True:
    meal_name = input("Jaké jídlo jsi snědl? (napiš 'konec' pro ukončení): ")
    if meal_name.lower() == "konec":
        break
    meal_calories = safe_number_input((f"Kolik kalorií mělo jídlo {meal_name}?: "))
    new_food_item = FoodItem(meal_name, meal_calories)
    tracker.add_meal(new_food_item)

print("Tvá dnešní jídla:")
for meal in tracker.meals:
    print(f"- {meal.name}: {meal.calories} kcal")

print(f"""{tracker.user_name}, tvůj denní cíl je {tracker.daily_goal} kalorií.
    Za dnešek si snědl {tracker.calories_eaten} kalorií!""")
if tracker.calories_eaten < tracker.daily_goal:
    print(f"Do konce dne ti zbývá sníst ještě {tracker.daily_goal - tracker.calories_eaten} kalorií.")
elif tracker.calories_eaten == tracker.daily_goal:
    print("Zvládnul jsi svůj denní cíl!")
else:
    print(f"Přesáhl jsi svůj denní cíl o {tracker.calories_eaten - tracker.daily_goal} kalorií!")

# with open("todays_meals", "w", encoding="utf-8") as file:
#     json.dump(meals, file, indent=4)