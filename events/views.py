import json
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import login, logout
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST
from .models import SavedEvent

def index(request):
    saved_ids = []
    if request.user.is_authenticated:
        saved_ids = list(SavedEvent.objects.filter(user=request.user).values_list('event_id', flat=True))
    return render(request, 'events/index.html', {'saved_ids_json': json.dumps(saved_ids)})

@login_required
def itinerary_view(request):
    # READ: Load user's itinerary & calculate totals
    events = SavedEvent.objects.filter(user=request.user)
    total_budget = sum(e.total_cost for e in events)
    total_tickets = sum(e.ticket_quantity for e in events)
    return render(request, 'events/itinerary.html', {
        'events': events,
        'total_budget': total_budget,
        'total_tickets': total_tickets,
    })

@login_required
@require_POST
def add_saved_event(request):
    # CREATE
    data = json.loads(request.body)
    event, created = SavedEvent.objects.get_or_create(
        user=request.user,
        event_id=data.get('event_id'),
        defaults={
            'event_name': data.get('event_name', 'Untitled Event'),
            'venue_name': data.get('venue_name', 'Venue TBA'),
            'venue_location': data.get('venue_location', ''),
            'event_date': data.get('event_date', 'Date TBA'),
            'event_time': data.get('event_time', ''),
            'image_url': data.get('image_url', ''),
            'ticket_url': data.get('ticket_url', ''),
            'max_ticket_budget': data.get('max_ticket_budget', 75.00),
            'ticket_quantity': data.get('ticket_quantity', 1),
            'priority': data.get('priority', 'MUST'),
            'notes': data.get('notes', ''),
        }
    )
    if not created:
        return JsonResponse({'status': 'exists', 'message': 'Already in your itinerary!'}, status=400)
    return JsonResponse({'status': 'created', 'id': event.id})

@login_required
@require_POST
def update_saved_event(request, pk):
    # UPDATE
    event = get_object_or_404(SavedEvent, pk=pk, user=request.user)
    data = json.loads(request.body)
    event.max_ticket_budget = data.get('max_ticket_budget', event.max_ticket_budget)
    event.ticket_quantity = int(data.get('ticket_quantity', event.ticket_quantity))
    event.priority = data.get('priority', event.priority)
    event.notes = data.get('notes', event.notes)
    event.save()

    all_events = SavedEvent.objects.filter(user=request.user)
    overall_budget = sum(e.total_cost for e in all_events)
    overall_tickets = sum(e.ticket_quantity for e in all_events)

    return JsonResponse({
        'status': 'updated',
        'item_total': float(event.total_cost),
        'overall_budget': float(overall_budget),
        'overall_tickets': overall_tickets,
    })

@login_required
@require_POST
def delete_saved_event(request, pk):
    # DELETE
    event = get_object_or_404(SavedEvent, pk=pk, user=request.user)
    event.delete()

    all_events = SavedEvent.objects.filter(user=request.user)
    overall_budget = sum(e.total_cost for e in all_events)
    overall_tickets = sum(e.ticket_quantity for e in all_events)

    return JsonResponse({
        'status': 'deleted',
        'overall_budget': float(overall_budget),
        'overall_tickets': overall_tickets,
        'remaining_count': all_events.count(),
    })

# --- Authentication Views (Extra Credit Opportunity 1) ---

def register_view(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
    else:
        form = UserCreationForm()
    return render(request, 'events/register.html', {'form': form})

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(data=request.POST)
        if form.is_valid():
            login(request, form.get_user())
            return redirect('index')
    else:
        form = AuthenticationForm()
    return render(request, 'events/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('index')