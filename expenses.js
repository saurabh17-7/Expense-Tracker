window.onload = function () {

  // =========================================================
  // API CONFIGURATION
  // =========================================================

  const API_URL =
    "https://n5qg4tv4f0.execute-api.ap-south-1.amazonaws.com/prod/expenses";

  let allExpenses = [];
  let filteredExpenses = [];

  // =========================================================
  // CHECK AUTHENTICATION
  // =========================================================

  const idToken = sessionStorage.getItem("idToken");

  if (!idToken) {
    alert("Please login first.");
    window.location.href = "index.html";
    return;
  }

  // =========================================================
  // LOAD EXPENSES
  // =========================================================

  loadExpenses();

  // =========================================================
  // SEARCH
  // =========================================================

  const searchInput =
    document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      filterAndDisplayExpenses();
    });
  }

  // =========================================================
  // SORT
  // =========================================================

  const sortSelect =
    document.getElementById("sortSelect");

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      filterAndDisplayExpenses();
    });
  }

  // =========================================================
  // LOAD ALL EXPENSES
  // =========================================================

  function loadExpenses() {

    const loadingMessage =
      document.getElementById("loadingMessage");

    const expensesTable =
      document.getElementById("expensesTable");

    const noExpensesMessage =
      document.getElementById("noExpensesMessage");

    const errorMessage =
      document.getElementById("errorMessage");

    if (loadingMessage) {
      loadingMessage.style.display = "block";
    }

    if (expensesTable) {
      expensesTable.style.display = "none";
    }

    if (noExpensesMessage) {
      noExpensesMessage.style.display = "none";
    }

    if (errorMessage) {
      errorMessage.style.display = "none";
    }

    const requestConfig = {
      method: "GET",

      headers: {
        "Authorization": idToken,
        "Content-Type": "application/json"
      }
    };

    console.log(
      "GET Expenses URL:",
      API_URL
    );

    fetch(API_URL, requestConfig)

      .then(response => {

        console.log(
          "GET response status:",
          response.status
        );

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}`
          );
        }

        return response.json();
      })

      .then(data => {

        console.log(
          "GET expenses response:",
          data
        );

        let expenses = [];

        // =====================================================
        // RESPONSE FORMAT 1
        // Direct array
        // =====================================================

        if (Array.isArray(data)) {

          expenses = data;

        }

        // =====================================================
        // RESPONSE FORMAT 2
        // { expenses: [...] }
        // =====================================================

        else if (
          data &&
          Array.isArray(data.expenses)
        ) {

          expenses = data.expenses;

        }

        // =====================================================
        // RESPONSE FORMAT 3
        // API Gateway body
        // =====================================================

        else if (
          data &&
          data.body
        ) {

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

        // =====================================================
        // STORE DATA
        // =====================================================

        allExpenses = expenses;

        filteredExpenses = [...allExpenses];

        if (loadingMessage) {
          loadingMessage.style.display = "none";
        }

        // =====================================================
        // NO EXPENSES
        // =====================================================

        if (allExpenses.length === 0) {

          if (noExpensesMessage) {
            noExpensesMessage.style.display = "block";
          }

          updateSummaryCards();

        }

        // =====================================================
        // EXPENSES FOUND
        // =====================================================

        else {

          updateSummaryCards();

          filterAndDisplayExpenses();

          if (expensesTable) {
            expensesTable.style.display = "table";
          }
        }
      })

      .catch(error => {

        console.error(
          "Error loading expenses:",
          error
        );

        if (loadingMessage) {
          loadingMessage.style.display = "none";
        }

        if (errorMessage) {

          errorMessage.style.display = "block";

          errorMessage.textContent =
            `Error loading expenses: ${error.message}`;
        }
      });
  }

  // =========================================================
  // UPDATE SUMMARY CARDS
  // =========================================================

  function updateSummaryCards() {

    const total =
      allExpenses.reduce(
        (sum, expense) => {

          const amount =
            parseFloat(
              expense.amount || 0
            );

          return sum +
            (isNaN(amount) ? 0 : amount);
        },
        0
      );

    const count =
      allExpenses.length;

    const average =
      count > 0
        ? total / count
        : 0;

    const totalElement =
      document.getElementById(
        "totalExpenses"
      );

    const countElement =
      document.getElementById(
        "expenseCount"
      );

    const averageElement =
      document.getElementById(
        "averageExpense"
      );

    if (totalElement) {

      totalElement.textContent =
        `$${total.toFixed(2)}`;
    }

    if (countElement) {

      countElement.textContent =
        count;
    }

    if (averageElement) {

      averageElement.textContent =
        `$${average.toFixed(2)}`;
    }
  }

  // =========================================================
  // FILTER AND SORT
  // =========================================================

  function filterAndDisplayExpenses() {

    const searchElement =
      document.getElementById(
        "searchInput"
      );

    const sortElement =
      document.getElementById(
        "sortSelect"
      );

    const searchTerm =
      searchElement
        ? searchElement.value
            .toLowerCase()
            .trim()
        : "";

    const sortOption =
      sortElement
        ? sortElement.value
        : "date-desc";

    // =====================================================
    // FILTER
    // =====================================================

    filteredExpenses =
      allExpenses.filter(expense => {

        // Lambda uses "name"
        const purpose =
          (
            expense.purpose ||
            expense.name ||
            expense.category ||
            expense.description ||
            ""
          )
            .toString()
            .toLowerCase();

        // Lambda uses "expenseId"
        const expenseId =
          (
            expense.expense_id ||
            expense.expenseId ||
            expense.id ||
            ""
          )
            .toString()
            .toLowerCase();

        return (
          purpose.includes(searchTerm) ||
          expenseId.includes(searchTerm)
        );
      });

    // =====================================================
    // SORT
    // =====================================================

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
            parseFloat(
              b.amount || 0
            ) -
            parseFloat(
              a.amount || 0
            )
          );

        case "amount-asc":

          return (
            parseFloat(
              a.amount || 0
            ) -
            parseFloat(
              b.amount || 0
            )
          );

        default:

          return 0;
      }
    });

    displayExpenses();
  }

  // =========================================================
  // DISPLAY EXPENSES
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

    // =====================================================
    // NO RESULTS
    // =====================================================

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

    // =====================================================
    // DISPLAY EACH EXPENSE
    // =====================================================

    filteredExpenses.forEach(expense => {

      const row =
        document.createElement("tr");

      // IMPORTANT:
      // Lambda returns "expenseId"
      const expenseId =
        expense.expenseId ||
        expense.expense_id ||
        expense.id ||
        "N/A";

      // Amount
      const amount =
        parseFloat(
          expense.amount || 0
        );

      // IMPORTANT:
      // Lambda returns "name"
      // If name is null, use category
      const purpose =
        expense.name ||
        expense.purpose ||
        expense.category ||
        expense.description ||
        "N/A";

      // Date
      const date =
        expense.date ||
        expense.timestamp;

      row.innerHTML = `
        <td>${expenseId}</td>

        <td class="amount-cell">
          $${isNaN(amount)
            ? "0.00"
            : amount.toFixed(2)}
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
  // GO BACK TO DASHBOARD
  // =========================================================

  window.goBack = function () {

    window.location.href =
      "expense-tracker.html";
  };

};