// Load meals from meals.json
let meals = [];
fetch('meals.json')
  .then(response => response.json())
  .then(data => {
    meals = data;
    loadMealOptions(); // Load meal options after fetching data
  })
  .catch(error => console.error('Error loading meals:', error));

// Function to load meal options on the Vote Page
function loadMealOptions() {
  const mealOptions = document.getElementById('mealOptions');
  if (mealOptions) {
    mealOptions.innerHTML = ''; // Clear existing options
    meals.forEach(meal => {
      const div = document.createElement('div');
      div.innerHTML = `
        <input type="checkbox" name="meal" value="${meal.name}" data-price="${meal.price}">
        ${meal.name} (₹${meal.price})
      `;
      mealOptions.appendChild(div);
    });

    // Add event listeners to checkboxes to update total cost
    const checkboxes = document.querySelectorAll('input[name="meal"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updateTotalCost);
    });
  }
}

// Function to update the total cost of selected meals
function updateTotalCost() {
  const checkboxes = document.querySelectorAll('input[name="meal"]:checked');
  let totalCost = 0;
  checkboxes.forEach(checkbox => {
    totalCost += parseFloat(checkbox.getAttribute('data-price'));
  });
  document.getElementById('totalCost').textContent = `Total Cost: ₹${totalCost}`;

  // Check if total cost exceeds the budget
  const budget = parseFloat(localStorage.getItem('budget')) || 50;
  const budgetMessage = document.getElementById('budgetMessage');
  if (totalCost > budget) {
    budgetMessage.textContent = 'Your selected meals exceed the budget. Please adjust your choices.';
    budgetMessage.style.color = 'red';
    document.getElementById('submitVote').disabled = true;
  } else {
    budgetMessage.textContent = '';
    document.getElementById('submitVote').disabled = false;
  }
}

// Function to save votes to localStorage
function saveVote(selectedMeals) {
  let votes = JSON.parse(localStorage.getItem('votes')) || [];
  votes.push({ studentId: localStorage.getItem('studentId'), meals: selectedMeals });
  localStorage.setItem('votes', JSON.stringify(votes));
}

// Function to save feedback to localStorage
function saveFeedback(date, foodTime, message) {
  let feedback = JSON.parse(localStorage.getItem('feedback')) || [];
  feedback.push({ date, foodTime, message });
  localStorage.setItem('feedback', JSON.stringify(feedback));
}

// Function to get the most popular meals within the budget
function getPopularMealsWithinBudget() {
  const budget = parseFloat(localStorage.getItem('budget')) || 50;
  let votes = JSON.parse(localStorage.getItem('votes')) || [];

  // Count votes for each meal
  const mealVotes = {};
  votes.forEach(vote => {
    vote.meals.forEach(meal => {
      if (mealVotes[meal]) {
        mealVotes[meal]++;
      } else {
        mealVotes[meal] = 1;
      }
    });
  });

  // Filter meals within budget and sort by votes
  const popularMeals = Object.keys(mealVotes)
    .filter(meal => {
      const mealData = meals.find(m => m.name === meal);
      return mealData && mealData.price <= budget;
    })
    .sort((a, b) => mealVotes[b] - mealVotes[a]);

  return popularMeals;
}

// Login Page
if (window.location.pathname.endsWith('index.html')) {
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = document.getElementById('studentId').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;

    // Simple validation (for demo purposes)
    if (studentId && password) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('userType', userType);
      localStorage.setItem('studentId', studentId);
      alert('Login successful! Redirecting...');
      window.location.href = userType === 'admin' ? 'admin.html' : 'vote.html';
    } else {
      alert('Please enter a valid Student ID and Password.');
    }
  });
}

// Vote Page
if (window.location.pathname.endsWith('vote.html')) {
  // Redirect to login page if not logged in
  if (!localStorage.getItem('loggedIn')) {
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'index.html';
  }

  // Load meal options
  loadMealOptions();

  // Submit vote
  document.getElementById('submitVote').addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[name="meal"]:checked');
    const selectedMeals = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (selectedMeals.length > 0) {
      saveVote(selectedMeals);
      alert('Vote submitted! Redirecting to dashboard...');
      window.location.href = 'dashboard.html';
    } else {
      alert('Please select at least one meal.');
    }
  });

  // Redirect to feedback page
  document.getElementById('feedbackButton').addEventListener('click', () => {
    window.location.href = 'feedback.html';
  });
}

// Dashboard Page
if (window.location.pathname.endsWith('dashboard.html')) {
  // Redirect to login page if not logged in
  if (!localStorage.getItem('loggedIn')) {
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'index.html';
  }

  // Display user's vote and total cost
  const userVote = document.getElementById('userVote');
  const totalCostDisplay = document.getElementById('totalCostDisplay');
  const votes = JSON.parse(localStorage.getItem('votes')) || [];
  const studentId = localStorage.getItem('studentId');
  const userVotes = votes.filter(vote => vote.studentId === studentId);

  if (userVotes.length > 0) {
    const lastVote = userVotes[userVotes.length - 1];
    const selectedMeals = lastVote.meals;
    const totalCost = selectedMeals.reduce((sum, meal) => {
      const mealData = meals.find(m => m.name === meal);
      return sum + (mealData ? mealData.price : 0);
    }, 0);

    userVote.textContent = selectedMeals.join(', ');
    totalCostDisplay.textContent = `Total Cost: ₹${totalCost}`;
  } else {
    userVote.textContent = 'Not voted yet.';
    totalCostDisplay.textContent = 'Total Cost: ₹0';
  }

  // Logout button
  document.getElementById('logout').addEventListener('click', () => {
    localStorage.clear();
    alert('Logged out successfully. Redirecting to login page...');
    window.location.href = 'index.html';
  });
}

// Admin Page
if (window.location.pathname.endsWith('admin.html')) {
  // Redirect to login page if not logged in or not an admin
  if (!localStorage.getItem('loggedIn') || localStorage.getItem('userType') !== 'admin') {
    alert('You are not authorized to access this page. Redirecting to login page...');
    window.location.href = 'index.html';
  }

  // Display all votes
  const allVotes = document.getElementById('allVotes');
  const votes = JSON.parse(localStorage.getItem('votes')) || [];
  allVotes.innerHTML = votes.map(vote => `
    <li>${vote.studentId}: ${vote.meals.join(', ')}</li>
  `).join('');

  // Update budget
  document.getElementById('updateBudget').addEventListener('click', () => {
    const budget = document.getElementById('budget').value;
    localStorage.setItem('budget', budget);
    alert('Budget updated successfully!');
  });

  // Display meals within budget
  const budgetMeals = document.getElementById('budgetMeals');
  const budget = parseFloat(localStorage.getItem('budget')) || 50;
  const mealsWithinBudget = meals.filter(meal => meal.price <= budget);
  budgetMeals.innerHTML = mealsWithinBudget.map(meal => `
    <li>${meal.name} (₹${meal.price})</li>
  `).join('');

  // Display most popular meals within budget
  const popularMeals = document.getElementById('popularMeals');
  const popularMealsList = getPopularMealsWithinBudget();
  popularMeals.innerHTML = popularMealsList.map(meal => `
    <li>${meal}</li>
  `).join('');

  // Display feedback
  const feedbackList = document.getElementById('feedbackList');
  const feedback = JSON.parse(localStorage.getItem('feedback')) || [];
  feedbackList.innerHTML = feedback.map(fb => `
    <li>
      <strong>Date:</strong> ${fb.date}<br>
      <strong>Food Time:</strong> ${fb.foodTime}<br>
      <strong>Message:</strong> ${fb.message}
    </li>
  `).join('');

  // Toggle voting system
  document.getElementById('toggleVoting').addEventListener('click', () => {
    const votingEnabled = localStorage.getItem('votingEnabled') !== 'false';
    localStorage.setItem('votingEnabled', !votingEnabled);
    document.getElementById('toggleVoting').textContent = votingEnabled ? 'Enable Voting' : 'Disable Voting';
  });
}

// Feedback Page
if (window.location.pathname.endsWith('feedback.html')) {
  // Redirect to login page if not logged in
  if (!localStorage.getItem('loggedIn')) {
    alert('You are not logged in. Redirecting to login page...');
    window.location.href = 'index.html';
  }

  // Submit feedback
  document.getElementById('feedbackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const date = document.getElementById('date').value;
    const foodTime = document.getElementById('foodTime').value;
    const message = document.getElementById('message').value;

    if (date && foodTime && message) {
      saveFeedback(date, foodTime, message);
      alert('Feedback submitted successfully!');
      document.getElementById('feedbackForm').reset();
    } else {
      alert('Please fill in all fields.');
    }
  });
}