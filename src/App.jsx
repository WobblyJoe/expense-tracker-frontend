
import { useState, useEffect } from "react";
import API from "./api";
import "./App.css";

function App() {
  const getToday = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset)
      .toISOString()
      .split("T")[0];
  };

  const today = getToday();

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Health",
    "Other",
  ];

  const fetchExpenses = async () => {
    try {
      setLoading(true);

      // FIX: No trailing slash
      const response = await API.get("");

      setExpenses(response.data);
    } catch (error) {
      console.error("Fetch error:", error);
      setMessage("Unable to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalSpent = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0
  );

  const filteredExpenses =
    filter === "All"
      ? expenses
      : expenses.filter(
          (expense) =>
            expense.category.toLowerCase() === filter.toLowerCase()
        );

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(getToday());
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !amount || Number(amount) <= 0 || !date) {
      setMessage("Please enter valid expense details.");
      return;
    }

    const expense = {
      title: title.trim(),
      amount: Number(amount),
      category,
      date,
    };

    try {
      setLoading(true);

      if (editingId !== null) {
        await API.put(`/${editingId}`, expense);
        setMessage("Expense updated successfully!");
      } else {
        // FIX: No trailing slash
        await API.post("", expense);
        setMessage("Expense added successfully!");
      }

      resetForm();

      const response = await API.get("");
      setExpenses(response.data);
    } catch (error) {
      console.error("Save error:", error);
      setMessage(
        error.response?.data?.message ||
          "Something went wrong!"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setTitle(expense.title);
    setAmount(String(expense.amount));
    setCategory(expense.category);
    setDate(expense.date);
    setEditingId(expense.id);
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) {
      return;
    }

    try {
      setLoading(true);

      await API.delete(`/${id}`);

      const response = await API.get("");
      setExpenses(response.data);

      if (editingId === id) {
        resetForm();
      }

      setMessage("Expense deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      setMessage("Unable to delete expense.");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    resetForm();
    setMessage("");
  };

  return (
    <div className="app-container">
      <main className="tracker-card">
        <header className="header">
          <div className="wallet-icon">💳</div>

          <h1>Personal Expense Tracker</h1>

          <div className="total-card">
            <p>Total Spent</p>

            <div className="total-amount">
              <span className="rupee-icon">₹</span>
              <span>₹{totalSpent.toFixed(2)}</span>
            </div>
          </div>
        </header>

        {message && (
          <div
            className={`message ${
              message.toLowerCase().includes("success")
                ? "success"
                : "error"
            }`}
          >
            <span>{message}</span>

            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        <form
          className="expense-form"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder="Expense Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Amount"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <button
            type="submit"
            className="add-button"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : editingId !== null
              ? "Update Expense"
              : "+ Add Expense"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </form>

        <section className="filter-section">
          <h2>Filter Expenses</h2>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All</option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        <section className="table-container">
          <table>
            <thead>
              <tr>
                <th>▤ &nbsp; Title</th>
                <th>₹ &nbsp; Amount</th>
                <th>◇ &nbsp; Category</th>
                <th>▣ &nbsp; Date</th>
                <th>⚙ &nbsp; Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && expenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="empty-message"
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="empty-message"
                  >
                    <div className="empty-icon">📭</div>
                    No expenses found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.title}</td>

                    <td className="amount-cell">
                      ₹{Number(expense.amount).toFixed(2)}
                    </td>

                    <td>
                      <span className="category-badge">
                        {expense.category}
                      </span>
                    </td>

                    <td>{expense.date}</td>

                    <td className="action-buttons">
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() => handleEdit(expense)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handleDelete(expense.id)
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <footer className="footer">
          Manage your money. Track your future.
        </footer>
      </main>
    </div>
  );
}

export default App;
