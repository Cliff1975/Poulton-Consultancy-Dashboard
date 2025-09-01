import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// Replace this with your actual EIX site URL
const DEFAULT_SITE_URL = "https://your-eix-site-url.com"; // <-- Update this!

const defaultCategories = [
  { name: 'Office Rent', fields: [] },
  { name: 'Software', fields: [] },
  { name: 'Salary', fields: [
    { label: 'Employee Name', type: 'text', name: 'employeeName' },
    { label: 'Designation', type: 'text', name: 'designation' },
    { label: 'Salary Amount', type: 'number', name: 'salaryAmount' },
  ]},
  { name: 'Travel', fields: [
    { label: 'Destination', type: 'text', name: 'destination' },
    { label: 'Purpose', type: 'text', name: 'purpose' },
  ]},
  { name: 'Other', fields: [] },
];

export default function CostExpenseForm() {
  const [form, setForm] = useState({
    description: '',
    date: '',
    amount: '',
    currency: 'AED',
    category: 'Other',
    taxDeductible: 'Yes',
    notes: '',
  });
  const [dynamicFields, setDynamicFields] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);

  // API integration state
  const [apiSettings, setApiSettings] = useState({
    siteUrl: DEFAULT_SITE_URL,
    apiKey: "4b34b942-4943-4da7-b529-384f89303134",
    lastSync: null,
    connected: false
  });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "category") setDynamicFields({});
  };

  const handleDynamicChange = e => {
    setDynamicFields({ ...dynamicFields, [e.target.name]: e.target.value });
  };

  const selectedCategory = categories.find(cat => cat.name === form.category);

  const handleSubmit = e => {
    e.preventDefault();
    const newExpense = { ...form, ...dynamicFields, id: Date.now() };
    setExpenses([...expenses, newExpense]);
    setForm({
      description: '',
      date: '',
      amount: '',
      currency: 'AED',
      category: 'Other',
      taxDeductible: 'Yes',
      notes: '',
    });
    setDynamicFields({});
  };

  // Add new categories and fields UI
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryFields, setNewCategoryFields] = useState([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  const addFieldToNewCategory = () => {
    if (!newFieldLabel) return;
    setNewCategoryFields([
      ...newCategoryFields,
      { label: newFieldLabel, type: newFieldType, name: newFieldLabel.replace(/\s+/g, '').toLowerCase() }
    ]);
    setNewFieldLabel('');
    setNewFieldType('text');
  };

  const addNewCategory = () => {
    if (newCategoryName) {
      setCategories([
        ...categories,
        { name: newCategoryName, fields: newCategoryFields }
      ]);
      setNewCategoryName('');
      setNewCategoryFields([]);
    }
  };

  // Excel export
  const handleDownloadExcel = () => {
    if (!expenses.length) {
      alert("No expenses to export!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(expenses);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, "expenses.xlsx");
  };

  // API integration
  const handleApiInput = e => {
    setApiSettings({ ...apiSettings, [e.target.name]: e.target.value });
  };

  const testApiConnection = async () => {
    if (!apiSettings.siteUrl || !apiSettings.apiKey) {
      alert('Please enter both EIX Site URL and API Key');
      return;
    }
    try {
      const response = await fetch(
        `${apiSettings.siteUrl}/_functions/financial/ping`,
        { headers: { 'x-api-key': apiSettings.apiKey } }
      );
      if (response.ok) {
        setApiSettings({
          ...apiSettings,
          connected: true,
          lastSync: new Date().toISOString()
        });
        alert('✅ Connected to EIX site!');
      } else {
        setApiSettings({ ...apiSettings, connected: false });
        alert('❌ Connection failed: ' + response.status);
      }
    } catch (err) {
      setApiSettings({ ...apiSettings, connected: false });
      alert('❌ Connection failed: ' + err.message);
    }
  };

  return (
    <div className="cost-expense-form" style={{maxWidth: 600, margin: "0 auto", fontFamily: "sans-serif"}}>
      <form onSubmit={handleSubmit} style={{padding: 20, background: "#f9f9f9", borderRadius: 12}}>
        <h3 style={{marginBottom: 10}}>Add New Cost/Expense</h3>
        <input type="text" name="description" placeholder="Description" value={form.description} onChange={handleChange} required style={{width: "100%", marginBottom: 8}} />
        <input type="date" name="date" value={form.date} onChange={handleChange} required style={{width: "100%", marginBottom: 8}} />
        <input type="number" name="amount" placeholder="Amount" value={form.amount} onChange={handleChange} required style={{width: "100%", marginBottom: 8}} />
        <select name="currency" value={form.currency} onChange={handleChange} style={{width: "100%", marginBottom: 8}}>
          <option value="AED">AED</option>
          <option value="USD">USD</option>
        </select>
        <select name="category" value={form.category} onChange={handleChange} style={{width: "100%", marginBottom: 8}}>
          {categories.map(cat => (
            <option key={cat.name} value={cat.name}>{cat.name}</option>
          ))}
        </select>
        <select name="taxDeductible" value={form.taxDeductible} onChange={handleChange} style={{width: "100%", marginBottom: 8}}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
        <textarea name="notes" placeholder="Additional notes..." value={form.notes} onChange={handleChange} style={{width: "100%", marginBottom: 8}} />

        {/* Render dynamic fields for selected category */}
        {selectedCategory && selectedCategory.fields.length > 0 && (
          <div className="dynamic-fields">
            <h4>Additional Fields for {form.category}</h4>
            {selectedCategory.fields.map(field => (
              <div key={field.name} style={{marginBottom: 8}}>
                <label>{field.label}:</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={dynamicFields[field.name] || ''}
                  onChange={handleDynamicChange}
                  style={{width: "100%"}}
                />
              </div>
            ))}
          </div>
        )}

        <button type="submit" style={{marginTop: 10}}>Submit</button>
      </form>

      {/* Section for adding a new category */}
      <div style={{marginTop: '2em', borderTop: '1px solid #ccc', paddingTop: '1em'}}>
        <h4>Add New Category</h4>
        <input type="text" placeholder="Category Name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{marginBottom: 8, width: "100%"}} />
        <div>
          <input type="text" placeholder="Field Label" value={newFieldLabel} onChange={e => setNewFieldLabel(e.target.value)} style={{marginBottom: 8}} />
          <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)} style={{marginBottom: 8}}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
          </select>
          <button type="button" onClick={addFieldToNewCategory}>Add Field</button>
        </div>
        {newCategoryFields.length > 0 && (
          <ul>
            {newCategoryFields.map((field, idx) => (
              <li key={idx}>{field.label} ({field.type})</li>
            ))}
          </ul>
        )}
        <button type="button" onClick={addNewCategory} style={{marginTop: 8}}>Add Category</button>
      </div>

      {/* Expenses Table + Excel Export */}
      <div style={{marginTop: '2em'}}>
        <h4>Submitted Expenses</h4>
        <button onClick={handleDownloadExcel} style={{marginBottom: 10}}>Download as Excel</button>
        <table style={{width: "100%", borderCollapse: "collapse"}}>
          <thead>
            <tr>
              <th>Description</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Category</th>
              <th>Tax Deductible</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(exp => (
              <tr key={exp.id}>
                <td>{exp.description}</td>
                <td>{exp.date}</td>
                <td>{exp.amount}</td>
                <td>{exp.currency}</td>
                <td>{exp.category}</td>
                <td>{exp.taxDeductible}</td>
                <td>{exp.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* API Integration Section */}
      <div style={{marginTop: '2em', borderTop: '1px solid #ccc', paddingTop: '1em'}}>
        <h4>EIX Site Integration</h4>
        <input
          type="url"
          name="siteUrl"
          placeholder="https://your-eix-site-url.com"
          value={apiSettings.siteUrl}
          onChange={handleApiInput}
          style={{marginBottom: 8, width: "100%"}}
        />
        <input
          type="password"
          name="apiKey"
          placeholder="Enter your EIX API key"
          value={apiSettings.apiKey}
          onChange={handleApiInput}
          style={{marginBottom: 8, width: "100%"}}
        />
        <button type="button" onClick={testApiConnection}>Test Connection</button>
        {apiSettings.connected && (
          <div style={{color: "green", marginTop: 8}}>
            Connected! Last Sync: {apiSettings.lastSync ? new Date(apiSettings.lastSync).toLocaleString() : 'Never'}
          </div>
        )}
        {!apiSettings.connected && apiSettings.siteUrl && apiSettings.apiKey && (
          <div style={{color: "orange", marginTop: 8}}>
            Not Connected
          </div>
        )}
      </div>
    </div>
  );
}
