-- Ajoute une heure optionnelle aux tâches, pour le module Agenda (vues
-- Jour/Semaine/Mois qui trient les tâches d'une journée par heure).
-- Nullable : une tâche peut n'avoir qu'une échéance (jour) sans heure
-- précise, auquel cas elle est affichée après les tâches ayant une heure.

alter table taches
  add column heure time;
