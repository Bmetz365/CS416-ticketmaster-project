$(document).ready(function(){
    console.log("Script loaded successfully!");
    const API_KEY = "LAAeMf4ZdxAZ0CwA7RZtcPo0e7X0qAjs";

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function formatTime(timeStr){
        if (!timeStr) return "";
        const [hours, minutes] = timeStr.split(":");
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${minutes} ${ampm}`;
    }

    function getBestImage(images){
        if (!images || images.length === 0) return "https://via.placeholder.com/300x200?text=No+Image";
        let bestImg = images[0];
        let maxResolution = (bestImg.width || 0) * (bestImg.height || 0);

        for (let i = 1; i < images.length; i++){
            let currentRes = (images[i].width || 0) * (images[i].height || 0);
            if (currentRes > maxResolution){
                maxResolution = currentRes;
                bestImg = images[i];
            }
        }
        return bestImg.url;
    }

    $("#searchBtn").on("click", function (){
        const classification = $("#classificationInput").val().trim();
        const city = $("#cityInput").val().trim();
        const $alertBox = $("#alertBox");
        const $alertMessage = $("#alertMessage");
        const $results = $("#results");
        const $eventCount = $("#eventCount");

        $results.empty();
        $eventCount.empty();
        $alertBox.addClass("d-none");

        if(classification === "" && city === ""){
            $alertMessage.text("Search term and city cannot be empty. Please enter both.");
            $alertBox.removeClass("d-none");
            return;
        }
        if(classification === ""){
            $alertMessage.text("Search term cannot be empty. Please enter a search term.");
            $alertBox.removeClass("d-none");
            return;
        }
        if (city === ""){
            $alertMessage.text("City cannot be empty. Please enter a city.");
            $alertBox.removeClass("d-none");
            return;
        }

        $.ajax({
            type: "GET",
            url: "https://app.ticketmaster.com/discovery/v2/events.json",
            data: {
                apikey: API_KEY,
                classificationName: classification,
                city: city,
                sort: "date,asc"
            },
            async: true,
            dataType: "json",
            success: function (json){
                if(!json._embedded || !json._embedded.events){
                    $results.html('<div class="card shadow-sm p-4 text-center"><p class="mb-0">Sorry... No results were found for the entered search term and city.</p></div>');
                    return;
                }

                const totalEvents = json.page?.totalElements || 0;
                $eventCount.text(`Found ${totalEvents} events matching your search.`);
                const events = json._embedded.events;

                events.forEach(event => {
                    const eventId = event.id;
                    const eventName = event.name || "Untitled Event";
                    const imageUrl = getBestImage(event.images);
                    const eventUrl = event.url || '#';

                    const dateTimeStr = event.dates?.start?.dateTime;
                    let formattedDate = "Date TBA";
                    let formattedTime = "";

                    if(dateTimeStr){
                        const dateObj = new Date(dateTimeStr);
                        formattedDate = dateObj.toDateString();
                    }

                    const localTimeStr = event.dates?.start?.localTime;
                    if(localTimeStr){
                        formattedTime = formatTime(localTimeStr);
                    }  

                    const venue = event._embedded?.venues?.[0] || {};
                    const venueName = venue.name || "Venue TBA";
                    const venueCity = venue.city?.name || "";
                    const venueState = venue.state?.name || "";
                    const venueAddress = venue.address?.line1 || "";
                    const venueLocation = `${venueCity}, ${venueState}`;

                    const isSaved = (window.SAVED_EVENT_IDS || []).includes(eventId);
                    const saveBtnHtml = isSaved
                        ? `<button class="btn btn-success btn-sm w-100 mt-2" disabled><i class="bi bi-check-circle"></i> Saved</button>`
                        : `<button class="btn btn-primary btn-sm w-100 mt-2 open-save-modal"
                                data-id="${eventId}"
                                data-name="${eventName.replace(/"/g, '&quot;')}"
                                data-venue="${venueName.replace(/"/g, '&quot;')}"
                                data-location="${venueLocation.replace(/"/g, '&quot;')}"
                                data-date="${formattedDate}"
                                data-time="${formattedTime}"
                                data-image="${imageUrl}"
                                data-url="${eventUrl}">
                                <i class="bi bi-bookmark-plus"></i> Save to Itinerary
                           </button>`;

                    const cardHtml = `
                        <div class="card shadow-sm mb-3 overflow-hidden">
                            <div class="row g-0 align-items-center">
                                <div class="col-md-3">
                                    <img src="${imageUrl}" class="img-fluid rounded-start h-100 object-fit-cover" alt="${eventName}" style="min-height: 160px;">
                                </div>
                                <div class="col-md-6">
                                    <div class="card-body">
                                        <h3 class="card-title h5 fw-bold">${eventName}</h3>
                                        <p class="card-text text-muted mb-1">
                                            <i class="bi bi-geo-alt-fill text-danger"></i> <strong>${venueName}</strong>
                                        </p>
                                        <p class="card-text mb-0 small text-secondary">${venueAddress}</p>
                                        <p class="card-text small text-secondary">${venueLocation}</p>
                                    </div>
                                </div>
                                <div class="col-md-3 text-md-end text-center p-3">
                                    <div class="text-primary-emphasis fw-bold mb-1">${formattedDate}</div>
                                    <div class="text-muted mb-2">${formattedTime}</div>
                                    <a href="${eventUrl}" target="_blank" class="btn btn-outline-primary btn-sm w-100">
                                        <i class="bi bi-ticket-perforated"></i> Find tickets
                                    </a>
                                    ${saveBtnHtml}
                                </div>
                            </div>
                        </div>
                    `;
                    $results.append(cardHtml);
                });
            },
            error: function () {
                $alertMessage.text("An error occurred while fetching data from Ticketmaster. Check your API key or network connection.");
                $alertBox.removeClass("d-none");
            }
        });
    });

    // Open Save Modal (redirects to login if unauthenticated)
    let activeSaveBtn = null;
    $(document).on("click", ".open-save-modal", function() {
        if (!window.IS_AUTHENTICATED) {
            window.location.href = "/login/";
            return;
        }
        activeSaveBtn = $(this);
        $("#modalEventId").val(activeSaveBtn.data("id"));
        $("#modalEventName").val(activeSaveBtn.data("name"));
        $("#modalVenueName").val(activeSaveBtn.data("venue"));
        $("#modalVenueLocation").val(activeSaveBtn.data("location"));
        $("#modalEventDate").val(activeSaveBtn.data("date"));
        $("#modalEventTime").val(activeSaveBtn.data("time"));
        $("#modalImageUrl").val(activeSaveBtn.data("image"));
        $("#modalTicketUrl").val(activeSaveBtn.data("url"));
        $("#modalEventTitleDisplay").text(activeSaveBtn.data("name"));

        const modal = new bootstrap.Modal(document.getElementById('saveEventModal'));
        modal.show();
    });

    // CREATE: Submit Save Event Form via AJAX
    $("#confirmSaveEventBtn").on("click", function() {
        const payload = {
            event_id: $("#modalEventId").val(),
            event_name: $("#modalEventName").val(),
            venue_name: $("#modalVenueName").val(),
            venue_location: $("#modalVenueLocation").val(),
            event_date: $("#modalEventDate").val(),
            event_time: $("#modalEventTime").val(),
            image_url: $("#modalImageUrl").val(),
            ticket_url: $("#modalTicketUrl").val(),
            max_ticket_budget: $("#modalBudgetInput").val(),
            ticket_quantity: $("#modalQtyInput").val(),
            priority: $("#modalPriorityInput").val(),
            notes: $("#modalNotesInput").val()
        };

        $.ajax({
            url: "/api/events/add/",
            type: "POST",
            headers: { "X-CSRFToken": getCookie("csrftoken") },
            contentType: "application/json",
            data: JSON.stringify(payload),
            success: function() {
                bootstrap.Modal.getInstance(document.getElementById('saveEventModal')).hide();
                if (activeSaveBtn) {
                    activeSaveBtn.removeClass("btn-primary open-save-modal")
                                 .addClass("btn-success")
                                 .html('<i class="bi bi-check-circle"></i> Saved')
                                 .prop("disabled", true);
                }
                window.SAVED_EVENT_IDS.push(payload.event_id);
            },
            error: function(xhr) {
                alert(xhr.responseJSON?.message || "Could not save event.");
            }
        });
    });
});