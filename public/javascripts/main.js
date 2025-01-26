// Function to show the success popup
function showSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.classList.add('show'); // Add the 'show' class to display the popup
  
    // Automatically hide the popup after 3 seconds
    setTimeout(() => {
      popup.classList.remove('show');
    }, 3000);
  }
  
  // Example: Call this function after successful form submission
  document.getElementById('submitForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent default form submission
    const formData = new FormData(this);
  
    // Send data to the server
    const response = await fetch('/submit', {
      method: 'POST',
      body: formData,
    });
  
    if (response.ok) {
      showSuccessPopup(); // Show success popup
      this.reset();
    } else {
      alert('Error submitting data. Please try again.'); // Handle error
    }
  });
  