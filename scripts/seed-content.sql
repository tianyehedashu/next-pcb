-- Sample Content Data for Testing
-- This script creates sample pages, posts, and other content for demonstration

-- Sample Pages
INSERT INTO content_pages (title, slug, content, excerpt, status, type, category_id, is_featured, author_id) VALUES
(
  'About SpeedXPCB',
  'about-speedxpcb',
  '# About SpeedXPCB

Welcome to SpeedXPCB, your trusted partner for high-quality PCB manufacturing and assembly services.

## Our Mission

We are committed to providing fast, reliable, and cost-effective PCB solutions for engineers, designers, and companies worldwide.

## Our Services

- **PCB Manufacturing**: From prototypes to production runs
- **PCB Assembly**: Surface mount and through-hole assembly
- **Design Support**: Expert guidance for optimal PCB design
- **Quality Assurance**: Rigorous testing and inspection processes

## Why Choose SpeedXPCB?

- **Fast Turnaround**: Get your PCBs in as little as 24 hours
- **Quality Guaranteed**: ISO certified manufacturing processes
- **Competitive Pricing**: Best value for your investment
- **Expert Support**: Dedicated technical support team',
  'Learn about SpeedXPCB and our commitment to quality PCB manufacturing services.',
  'published',
  'page',
  (SELECT id FROM content_categories WHERE slug = 'pages' LIMIT 1),
  true,
  NULL
),
(
  'PCB Design Guidelines',
  'pcb-design-guidelines',
  '# PCB Design Guidelines

Creating a successful PCB requires careful attention to design principles and best practices.

## Basic Design Rules

### 1. Component Placement
- Place components logically
- Consider signal flow
- Minimize trace lengths
- Ensure adequate spacing

### 2. Routing Guidelines
- Use appropriate trace widths
- Minimize via usage
- Follow impedance requirements
- Separate analog and digital sections

### 3. Power and Ground Planes
- Use dedicated power planes
- Implement proper grounding
- Consider power distribution
- Plan for decoupling capacitors

## Advanced Considerations

- **EMI/EMC Compliance**: Design for electromagnetic compatibility
- **Thermal Management**: Plan for heat dissipation
- **Manufacturing Constraints**: Follow DFM guidelines
- **Testing Access**: Include test points and programming interfaces',
  'Essential guidelines for creating professional PCB designs that work reliably.',
  'published',
  'help',
  (SELECT id FROM content_categories WHERE slug = 'help' LIMIT 1),
  true,
  NULL
),
(
  'Understanding PCB Materials',
  'understanding-pcb-materials',
  '# Understanding PCB Materials

The choice of PCB material significantly impacts performance, cost, and manufacturing.

## Common PCB Materials

### FR4 (Standard)
- Most common material
- Good electrical properties
- Cost-effective
- Suitable for most applications

### High-Frequency Materials
- Rogers materials
- Low loss tangent
- Stable dielectric constant
- Used in RF/microwave applications

### Flexible Materials
- Polyimide base
- Bendable circuits
- Space-saving designs
- Dynamic flexing capability

## Material Selection Criteria

Consider these factors when choosing PCB materials:
- **Operating frequency**
- **Temperature range**
- **Mechanical requirements**
- **Cost constraints**
- **Environmental conditions**',
  'Complete guide to PCB materials and how to choose the right one for your project.',
  'published',
  'post',
  (SELECT id FROM content_categories WHERE slug = 'blog' LIMIT 1),
  false,
  NULL
),
(
  'New High-Speed PCB Service Launch',
  'high-speed-pcb-service-launch',
  '# Introducing Our New High-Speed PCB Service

We are excited to announce the launch of our specialized high-speed PCB manufacturing service.

## What''s New?

- **24-hour turnaround** for prototype orders
- **Advanced impedance control** with ±5% tolerance
- **Specialized high-frequency materials** including Rogers and Taconic
- **Enhanced testing capabilities** for signal integrity validation

## Key Features

### Lightning-Fast Production
Our new production line is optimized for speed without compromising quality.

### Precision Engineering
State-of-the-art equipment ensures consistent results for demanding applications.

### Expert Support
Our experienced team provides technical guidance throughout the process.

## Applications

Perfect for:
- High-speed digital circuits
- RF and microwave designs
- Aerospace and defense
- Telecommunications equipment

Contact us today to learn more about how our high-speed PCB service can accelerate your project timeline.',
  'SpeedXPCB launches new high-speed PCB manufacturing service with 24-hour turnaround.',
  'published',
  'news',
  (SELECT id FROM content_categories WHERE slug = 'news' LIMIT 1),
  true,
  NULL
),
(
  'Quality Control Process',
  'quality-control-process',
  '# Our Quality Control Process

At SpeedXPCB, quality is our top priority. Every PCB goes through rigorous testing and inspection.

## Incoming Material Inspection

All raw materials are inspected upon arrival:
- **Substrate verification**
- **Copper thickness measurement**
- **Material certification review**

## In-Process Monitoring

Throughout manufacturing:
- **Real-time process monitoring**
- **Critical dimension measurement**
- **Plating thickness verification**
- **Registration accuracy checks**

## Final Testing

Before shipment:
- **Electrical testing** (100% continuity check)
- **Impedance verification** (when specified)
- **Visual inspection** (AOI and manual)
- **Dimensional verification**

## Certifications

We maintain the following certifications:
- ISO 9001:2015
- IPC Class 2/3 standards
- RoHS compliance
- UL recognition

Your success is our success, and quality is the foundation of that partnership.',
  'Learn about our comprehensive quality control process that ensures reliable PCBs.',
  'published',
  'page',
  (SELECT id FROM content_categories WHERE slug = 'pages' LIMIT 1),
  false,
  NULL
);

-- Update some pages with tag associations
INSERT INTO content_page_tags (page_id, tag_id) 
SELECT p.id, t.id 
FROM content_pages p, content_tags t 
WHERE p.slug = 'pcb-design-guidelines' AND t.slug = 'technical-guide';

INSERT INTO content_page_tags (page_id, tag_id) 
SELECT p.id, t.id 
FROM content_pages p, content_tags t 
WHERE p.slug = 'understanding-pcb-materials' AND t.slug = 'pcb-manufacturing';

INSERT INTO content_page_tags (page_id, tag_id) 
SELECT p.id, t.id 
FROM content_pages p, content_tags t 
WHERE p.slug = 'high-speed-pcb-service-launch' AND t.slug = 'company-news';

INSERT INTO content_page_tags (page_id, tag_id) 
SELECT p.id, t.id 
FROM content_pages p, content_tags t 
WHERE p.slug = 'high-speed-pcb-service-launch' AND t.slug = 'product-update';

INSERT INTO content_page_tags (page_id, tag_id) 
SELECT p.id, t.id 
FROM content_pages p, content_tags t 
WHERE p.slug = 'quality-control-process' AND t.slug = 'quality-control'; 