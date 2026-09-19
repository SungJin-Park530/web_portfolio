---
title: "Atlas Commerce Platform"
category: "Full-Stack"
role: "FULL-STACK ENGINEER · BACKEND"
period: "2025.04 - 2025.09"
thumbnail: "../../assets/images/sample1.png"
videoUrl: "https://www.youtube.com/watch?v=VIDEO_PLACEHOLDER_1"
summary: "A resilient commerce platform for real-time inventory, order processing, and customer operations."
highlights:
  - "Reduced checkout response time by 41% with asynchronous order workflows."
  - "Handled inventory synchronization across 120+ stores with event-driven processing."
  - "Improved deployment confidence through automated end-to-end testing and observability."
techStack:
  - "Next.js"
  - "TypeScript"
  - "Spring Boot"
  - "PostgreSQL"
  - "Redis"
  - "Docker"
tags: ["featured", "commerce", "spring", "full-stack"]
order: 1
---

# Atlas Commerce Platform

## Background

Atlas Commerce Platform is a fictional unified workspace for retail teams. It brings product catalog management, stock visibility, order processing, and customer support into one responsive web application.

## System Architecture

The frontend is built with Next.js and communicates with a Spring Boot API through a versioned REST interface. PostgreSQL stores transactional data, while Redis provides short-lived cart state and frequently accessed inventory snapshots.

Order events are published to a lightweight message queue after checkout. Separate workers update fulfillment status and notify connected dashboards without blocking the customer-facing request.

## Troubleshooting and Optimization

The first version recalculated stock totals during every checkout request, which caused latency spikes during peak traffic. The solution introduced inventory reservation records and a background reconciliation job. This allowed the checkout path to remain short while preserving consistency through periodic verification.

A second issue involved duplicated webhook deliveries from an external payment provider. Idempotency keys and a processed-event table were added so repeated callbacks safely produce the same result.

## Results

The fictional project now supports faster checkout flows, clearer operational visibility, and a deployment process that can be validated before each release.
