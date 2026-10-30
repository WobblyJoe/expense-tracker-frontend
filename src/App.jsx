
import { useState, useEffect } from "react";
import API from "./api";
import "./App.css";

function App() {
  const today = new Date().toISOString().split("T")[0];

  const [expenses, setExpenses] = useState([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await API.get("/");
      setExpenses(response.data);
    } catch (error) {
      setMessage("Unable to load expenses. Please try again.");
      console.error(error);
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

      if (editingId) {
        await API.put(`/${editingId}`, expense);
        setMessage("Expense updated successfully!");
      } else {
        await API.post("/", expense);
        setMessage("Expense added successfully!");
      }

      setTitle("");
      setAmount("");
      setCategory("Food");
      setDate(today);
      setEditingId(null);

      await fetchExpenses();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong!"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (expense) => {
    setTitle(expense.title);
    setAmount(expense.amount);
    setCategory(expense.category);
    setDate(expense.date);
    setEditingId(expense.id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await API.delete(`/${id}`);
      setMessage("Expense deleted successfully!");
      await fetchExpenses();
    } catch (error) {
      setMessage("Unable to delete expense.");
      console.error(error);
    }
  };

  const cancelEdit = () => {
    setTitle("");
    setAmount("");
    setCategory("Food");
    setDate(today);
    setEditingId(null);
    setMessage("");
  };

  return (
    <div className="app-container">
      <main className="tracker-card">

        <header className="header">
          <div className="wallet-icon">▣</div>
          <h1>Personal Expense Tracker</h1>

          <div className="total-card">
            <p>Total Spent</p>
            <div className="total-amount">
              <span className="rupee-icon">₹</span>
              ₹{totalSpent.toFixed(2)}
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
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        <form className="expense-form" onSubmit={handleSubmit}>
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
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Health</option>
            <option>Other</option>
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <button type="submit" className="add-button" disabled={loading}>
            {loading
              ? "Please wait..."
              : editingId
              ? "Update Expense"
              : "+ Add Expense"}
          </button>

          {editingId && (
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
            <option>All</option>
            <option>Food</option>
            <option>Travel</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Health</option>
            <option>Other</option>
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
                  <td colSpan="5" className="empty-message">
                    Loading expenses...
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-message">
                    <div className="empty-icon">♧</div>
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
                        className="edit-button"
                        onClick={() => handleEdit(expense)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(expense.id)}
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
