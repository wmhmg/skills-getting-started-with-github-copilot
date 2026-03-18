document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      activitiesList.innerHTML = "";
      activitySelect.innerHTML = ""; // 기존 옵션 초기화

      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const participants = details.participants || [];
        const spotsLeft = details.max_participants - participants.length;

        // Participants list markup
        let participantsMarkup = "";
        if (details.participants && details.participants.length > 0) {
          participantsMarkup = `
            <div class="participants-section">
              <strong>Participants:</strong>
              <ul class="participants-list no-bullets">
                ${details.participants.map(
                  (email) => `
                    <li class="participant-item">
                      <span class="participant-email">${email}</span>
                      <button class="delete-participant" title="Remove participant" data-activity="${name}" data-email="${email}">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="10" cy="10" r="10" fill="#ffebee"/>
                          <path d="M6 6L14 14M14 6L6 14" stroke="#c62828" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </li>
                  `
                ).join("")}
              </ul>
            </div>
          `;
        } else {
          participantsMarkup = `
            <div class="participants-section empty">
              <strong>Participants:</strong>
              <span class="no-participants">No participants yet</span>
            </div>
          `;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsMarkup}
        `;

        activitiesList.appendChild(activityCard);

        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // 삭제 아이콘 클릭 이벤트 위임
      activitiesList.querySelectorAll(".delete-participant").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          const activity = btn.getAttribute("data-activity");
          const email = btn.getAttribute("data-email");
          if (!activity || !email) return;
          if (!confirm(`Unregister ${email} from ${activity}?`)) return;
          try {
            const response = await fetch(
              `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
              {
                method: "DELETE",
              }
            );
            if (response.ok) {
              fetchActivities(); // 새로고침
            } else {
              const result = await response.json();
              alert(result.detail || "Failed to unregister participant.");
            }
          } catch (error) {
            alert("Failed to unregister participant. Please try again.");
          }
        });
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // 참가자 등록 후 활동 목록 갱신
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
