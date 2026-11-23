from django.db import models
from django.contrib.auth.models import User

class SavedEvent(models.Model):
    PRIORITY_CHOICES = [
        ('MUST', 'Must-Go'),
        ('MAYBE', 'Maybe'),
        ('BACKUP', 'Backup'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saved_events')
    event_id = models.CharField(max_length=100)
    event_name = models.CharField(max_length=255)
    venue_name = models.CharField(max_length=255, blank=True)
    venue_location = models.CharField(max_length=255, blank=True)
    event_date = models.CharField(max_length=100, blank=True)
    event_time = models.CharField(max_length=50, blank=True)
    image_url = models.URLField(max_length=500, blank=True)
    ticket_url = models.URLField(max_length=500, blank=True)

    # CRUD Planner & Budget fields
    max_ticket_budget = models.DecimalField(max_digits=8, decimal_places=2, default=75.00)
    ticket_quantity = models.PositiveIntegerField(default=1)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MUST')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'event_id')
        ordering = ['created_at']

    @property
    def total_cost(self):
        return self.max_ticket_budget * self.ticket_quantity

    def __str__(self):
        return f"{self.user.username} - {self.event_name}"