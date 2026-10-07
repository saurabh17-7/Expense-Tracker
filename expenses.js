window.onload = function () {

  // API Configuration
  const API_URL =
    "https://n5qg4tv4f0.execute-api.ap-south-1.amazonaws.com/prod/expenses";

  let allExpenses = [];
  let filteredExpenses = [];

  // Check if user is authenticated
  const idToken = sessionStorage.getItem("idToken");

  if (!idToken) {
    alert("Please login first.");
    window.location.href = "index.html";
    return;
  }

  // Load expenses on page load
  loadExpenses();

  // Search functionality
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterAndDisplayExpenses();
    });
  }

  // Sort functionality
  const sortSelect = document.getElementById("sortSelect");

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      filterAndDisplayExpenses();
    });
  }

  // =========================================================
  // LOAD ALL EXPENSES
  // =========================================================

  function loadExpenses() {

    document.getElementById("loadingMessage").style.display = "block";
    document.getElementById("expensesTable").style.display = "none";
    document.getElementById("noExpensesMessage").style.display = "none";
    document.getElementById("errorMessage").style.display = "none";

    const requestConfig = {
      method: "GET",

      headers: {
        "Authorization": idToken,
        "Content-Type": "application/json"
      }
    };

    console.log("GET Expenses URL:", API_URL);

    fetch(API_URL, requestConfig)

      .then(response => {

        console.log("GET response status:", response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
      })

      .then(data => {

        console.log("GET expenses response:", data);

        // Handle different response formats
        let expenses = [];

        // Case 1: Direct array
        if (Array.isArray(data)) {

          expenses = data;

        }

        // Case 2: { expenses: [...] }
        else if (
          data &&
          data.expenses &&
          Array.isArray(data.expenses)
        ) {

          expenses = data.expenses;

        }

        // Case 3: API Gateway Lambda response
        else if (data && data.body) {

          try {

            const bodyData =
              typeof data.body === "string"
                ? JSON.parse(data.body)
                : data.body;

            if (Array.isArray(bodyData)) {

              expenses = bodyData;

            } else if (
              bodyData &&
              Array.isArray(bodyData.expenses)
            ) {

              expenses = bodyData.expenses;

            }

          } catch (error) {

            console.error(
              "Error parsing response body:",
              error
            );

            expenses = [];
          }
        }

        allExpenses = expenses;
        filteredExpenses = [...allExpenses];

        // Hide loading
        document.getElementById("loadingMessage").style.display = "none";

        // No expenses
        if (allExpenses.length === 0) {

          document.getElementById(
            "noExpensesMessage"
          ).style.display = "block";

          // Update cards to zero
          updateSummaryCards();

        }

        // Expenses found
        else {

          updateSummaryCards();

          filterAndDisplayExpenses();

          document.getElementById(
            "expensesTable"
          ).style.display = "table";
        }
      })

      .catch(error => {

        console.error(
          "Error loading expenses:",
          error
        );

        document.getElementById(
          "loadingMessage"
        ).style.display = "none";

        document.getElementById(
          "errorMessage"
        ).style.display = "block";

        document.getElementById(
          "errorMessage"
        ).textContent =
          `Error loading expenses: ${error.message}`;
      });
  }

  // =========================================================
  // UPDATE SUMMARY CARDS
  // =========================================================

  function updateSummaryCards() {

    const total = allExpenses.reduce(
      (sum, expense) => {

        const amount =
          parseFloat(expense.amount || 0);

        return sum + (
          isNaN(amount) ? 0 : amount
        );
      },
      0
    );

    const count = allExpenses.length;

    const average =
      count > 0
        ? total / count
        : 0;

    const totalElement =
      document.getElementById("totalExpenses");

    const countElement =
      document.getElementById("expenseCount");

    const averageElement =
      document.getElementById("averageExpense");

    if (totalElement) {
      totalElement.textContent =
        `$${total.toFixed(2)}`;
    }

    if (countElement) {
      countElement.textContent = count;
    }

    if (averageElement) {
      averageElement.textContent =
        `$${average.toFixed(2)}`;
    }
  }

  // =========================================================
  // FILTER AND DISPLAY EXPENSES
  // =========================================================

  function filterAndDisplayExpenses() {

    const searchElement =
      document.getElementById("searchInput");

    const sortElement =
      document.getElementById("sortSelect");

    const searchTerm =
      searchElement
        ? searchElement.value.toLowerCase()
        : "";

    const sortOption =
      sortElement
        ? sortElement.value
        : "date-desc";

    // Filter expenses
    filteredExpenses =
      allExpenses.filter(expense => {

        const purpose =
          (
            expense.purpose ||
            expense.description ||
            ""
          ).toLowerCase();

        const expenseId =
          (
            expense.expense_id ||
            expense.id ||
            ""
          ).toString().toLowerCase();

        return (
          purpose.includes(searchTerm) ||
          expenseId.includes(searchTerm)
        );
      });

    // Sort expenses
    filteredExpenses.sort((a, b) => {

      switch (sortOption) {

        case "date-desc":

          return (
            new Date(
              b.date ||
              b.timestamp ||
              0
            ) -
            new Date(
              a.date ||
              a.timestamp ||
              0
            )
          );

        case "date-asc":

          return (
            new Date(
              a.date ||
              a.timestamp ||
              0
            ) -
            new Date(
              b.date ||
              b.timestamp ||
              0
            )
          );

        case "amount-desc":

          return (
            parseFloat(b.amount || 0) -
            parseFloat(a.amount || 0)
          );

        case "amount-asc":

          return (
            parseFloat(a.amount || 0) -
            parseFloat(b.amount || 0)
          );

        default:

          return 0;
      }
    });

    // Display results
    displayExpenses();
  }

  // =========================================================
  // DISPLAY EXPENSES IN TABLE
  // =========================================================

  function displayExpenses() {

    const tbody =
      document.getElementById(
        "expenseTableBody"
      );

    if (!tbody) {
      console.error(
        "expenseTableBody element not found."
      );
      return;
    }

    tbody.innerHTML = "";

    if (filteredExpenses.length === 0) {

      tbody.innerHTML = `
        <tr>
          <td
            colspan="4"
            style="
              text-align: center;
              padding: 32px;
              color: #888;
            "
          >
            No expenses match your search criteria.
          </td>
        </tr>
      `;

      return;
    }

    filteredExpenses.forEach(expense => {

      const row =
        document.createElement("tr");

      const expenseId =
        expense.expense_id ||
        expense.id ||
        "N/A";

      const amount =
        parseFloat(expense.amount || 0);

      const purpose =
        expense.purpose ||
        expense.description ||
        "N/A";

      const date =
        expense.date ||
        expense.timestamp;

      row.innerHTML = `
        <td>${expenseId}</td>

        <td class="amount-cell">
          $${isNaN(amount) ? "0.00" : amount.toFixed(2)}
        </td>

        <td>${purpose}</td>

        <td>${formatDate(date)}</td>
      `;

      tbody.appendChild(row);
    });
  }

  // =========================================================
  // FORMAT DATE
  // =========================================================

  function formatDate(dateString) {

    if (!dateString) {
      return "N/A";
    }

    try {

      const date =
        new Date(dateString);

      if (isNaN(date.getTime())) {
        return dateString;
      }

      return date.toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric"
        }
      );

    } catch (error) {

      return dateString;
    }
  }

  // =========================================================
  // GO BACK TO MAIN PAGE
  // =========================================================

  window.goBack = function () {

    window.location.href =
      "expense-tracker.html";
  };

};