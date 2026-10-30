
import { useState, useEffect, useCallback } from "react";
import API from "./api";
import "./App.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState("All");
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10)
  });

  const loadExpenses = useCallback(async () => {
    try {
      const res = await API.get("", {
        params: filter === "All" ? {} : { category: filter }
      });
      setExpenses(res.data);
      setError("");
    } catch (err) {
      setError("Failed to load expenses. Check backend connection.");
    }
  }, [filter]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Frontend validation
    if (!form.title.trim()) {
      setError("Please enter an expense title.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0 ||
        !Number.isFinite(Number(form.amount))) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!form.date) {
      setError("Please select a date.");
      return;
    }

    try {
      const expenseData = {
        ...form,
        title: form.title.trim(),
        amount: Number(form.amount)
      };

      if (editId) {
        await API.put("/" + editId, expenseData);
        setMessage("Expense updated successfully!");
      } else {
        await API.post("", expenseData);
        setMessage("Expense added successfully!");
      }

      setEditId(null);
      setForm({
        title: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().slice(0, 10)
      });

      await loadExpenses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save expense. Please try again."
      );
    }
  };

  const handleEdit = (expense) => {
    setEditId(expense.id);
    setMessage("");
    setError("");

    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date
    });
  };

  const handleDelete = async (id) => {
    setMessage("");
    setError("");

    try {
      await API.delete("/" + id);
      setMessage("Expense deleted successfully!");
      await loadExpenses();
    } catch (err) {
      setError("Unable to delete expense.");
    }
  };

  const total = expenses.reduce(
    (sum, item) => sum + Number(item.amount), 0
  );

  return (
    <div className="container">
      <h1>Personal Expense Tracker</h1>
      <h2>Total Spent: ₹{total.toFixed(2)}</h2>

      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Expense Title"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})}
          required
        />

        <input
          type="number"
          placeholder="Amount"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={e => setForm({...form, amount: e.target.value})}
          required
        />

        <select
          value={form.category}
          onChange={e => setForm({...form, category: e.target.value})}
        >
          <option>Food</option>
          <option>Travel</option>
          <option>Shopping</option>
          <option>Other</option>
        </select>

        <input
          type="date"
          value={form.date}
          onChange={e => setForm({...form, date: e.target.value})}
          required
        />

        <button type="submit">
          {editId ? "Update Expense" : "Add Expense"}
        </button>
      </form>

      <h3>Filter Expenses</h3>

      <select value={filter} onChange={e => setFilter(e.target.value)}>
        <option>All</option>
        <option>Food</option>
        <option>Travel</option>
        <option>Shopping</option>
        <option>Other</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>₹{item.amount}</td>
              <td>{item.category}</td>
              <td>{item.date}</td>
              <td>
                <button onClick={() => handleEdit(item)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {expenses.length === 0 && <p>No expenses found.</p>}
    </div>
  );
}

export default App;
