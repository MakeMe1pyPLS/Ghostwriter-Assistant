// Industry KPI library.
// Shared by the browser (KPI Library page, Growth Plan targets) and the server
// (rule-based growth plans, AI prompt context). Each entry is a compact tuple so
// the file stays readable; `INDUSTRY_KPIS` expands them into typed objects.
//
// Tuple: [name, unit, direction, category, how it's measured]
//   unit:      '%' | '$' | '#' | 'days' | 'hrs' | 'min' | 'x' | 'score'
//   direction: 'up' (higher is better) | 'down' (lower is better)

export type KpiUnit = '%' | '$' | '#' | 'days' | 'hrs' | 'min' | 'x' | 'score';
export type KpiDirection = 'up' | 'down';
export type KpiCategory = 'Growth' | 'Profit' | 'Operations' | 'Customer' | 'People' | 'Cash' | 'Quality' | 'Partners';

export interface IndustryKpi {
  id: string;
  name: string;
  unit: KpiUnit;
  direction: KpiDirection;
  category: KpiCategory;
  formula: string;
  industryId: string;
}

export interface Industry {
  id: string;
  name: string;
  group: IndustryGroup;
  kpis: IndustryKpi[];
}

export type IndustryGroup =
  | 'Every business'
  | 'Retail & commerce'
  | 'Food & hospitality'
  | 'Logistics & transport'
  | 'Manufacturing & industrial'
  | 'Professional services'
  | 'Technology'
  | 'Health & wellness'
  | 'Home & local services'
  | 'Real estate & finance'
  | 'Education & community'
  | 'Media & entertainment';

type T = [string, KpiUnit, KpiDirection, KpiCategory, string];

const RAW: { id: string; name: string; group: IndustryGroup; kpis: T[] }[] = [
  {
    id: 'universal', name: 'Every business', group: 'Every business', kpis: [
      ['Revenue', '$', 'up', 'Growth', 'Total sales in the period'],
      ['Revenue growth rate', '%', 'up', 'Growth', '(This period − last period) ÷ last period'],
      ['Gross margin', '%', 'up', 'Profit', '(Revenue − cost of goods) ÷ revenue'],
      ['Net profit margin', '%', 'up', 'Profit', 'Net profit ÷ revenue'],
      ['Operating expenses ratio', '%', 'down', 'Profit', 'Operating expenses ÷ revenue'],
      ['Cash runway', 'days', 'up', 'Cash', 'Cash on hand ÷ average daily net burn'],
      ['Cash conversion cycle', 'days', 'down', 'Cash', 'Days inventory + days receivable − days payable'],
      ['Days sales outstanding', 'days', 'down', 'Cash', 'Accounts receivable ÷ revenue × days in period'],
      ['Customer acquisition cost', '$', 'down', 'Growth', 'Sales + marketing spend ÷ new customers'],
      ['Customer lifetime value', '$', 'up', 'Customer', 'Average margin per customer × expected customer lifespan'],
      ['LTV to CAC ratio', 'x', 'up', 'Growth', 'Customer lifetime value ÷ acquisition cost'],
      ['Customer retention rate', '%', 'up', 'Customer', 'Customers kept ÷ customers at start of period'],
      ['Net Promoter Score', 'score', 'up', 'Customer', '% promoters − % detractors'],
      ['Revenue per employee', '$', 'up', 'People', 'Revenue ÷ full-time equivalents'],
      ['Employee turnover', '%', 'down', 'People', 'Leavers ÷ average headcount'],
      ['On-time delivery to customers', '%', 'up', 'Operations', 'Orders delivered by promise date ÷ all orders'],
    ],
  },

  // Retail & commerce
  {
    id: 'ecommerce', name: 'E-commerce & DTC', group: 'Retail & commerce', kpis: [
      ['Conversion rate', '%', 'up', 'Growth', 'Orders ÷ sessions'],
      ['Average order value', '$', 'up', 'Growth', 'Revenue ÷ orders'],
      ['Cart abandonment rate', '%', 'down', 'Customer', 'Carts not purchased ÷ carts created'],
      ['Return rate', '%', 'down', 'Quality', 'Units returned ÷ units sold'],
      ['Repeat purchase rate', '%', 'up', 'Customer', 'Customers with 2+ orders ÷ all customers'],
      ['Return on ad spend', 'x', 'up', 'Growth', 'Ad-attributed revenue ÷ ad spend'],
      ['Fulfillment cycle time', 'hrs', 'down', 'Operations', 'Order placed to order shipped'],
      ['Inventory turnover', 'x', 'up', 'Operations', 'Cost of goods sold ÷ average inventory'],
      ['Stockout rate', '%', 'down', 'Operations', 'SKU-days out of stock ÷ total SKU-days'],
      ['Shipping cost per order', '$', 'down', 'Profit', 'Total shipping spend ÷ orders shipped'],
    ],
  },
  {
    id: 'retail-store', name: 'Brick-and-mortar retail', group: 'Retail & commerce', kpis: [
      ['Sales per square foot', '$', 'up', 'Growth', 'Revenue ÷ selling floor area'],
      ['Foot traffic', '#', 'up', 'Growth', 'Visitors entering the store'],
      ['Store conversion rate', '%', 'up', 'Growth', 'Transactions ÷ visitors'],
      ['Average transaction value', '$', 'up', 'Growth', 'Revenue ÷ transactions'],
      ['Units per transaction', '#', 'up', 'Growth', 'Units sold ÷ transactions'],
      ['Shrinkage rate', '%', 'down', 'Profit', 'Inventory loss ÷ sales'],
      ['Sell-through rate', '%', 'up', 'Operations', 'Units sold ÷ units received'],
      ['Sales per labor hour', '$', 'up', 'People', 'Revenue ÷ staff hours worked'],
    ],
  },
  {
    id: 'grocery', name: 'Grocery & convenience', group: 'Retail & commerce', kpis: [
      ['Basket size', '$', 'up', 'Growth', 'Revenue ÷ transactions'],
      ['Spoilage rate', '%', 'down', 'Profit', 'Value discarded ÷ perishable inventory value'],
      ['Out-of-stock rate', '%', 'down', 'Operations', 'Items unavailable at shelf ÷ items tracked'],
      ['Checkout wait time', 'min', 'down', 'Customer', 'Average time in queue'],
      ['Private label share', '%', 'up', 'Profit', 'Store-brand sales ÷ total sales'],
      ['Vendor fill rate', '%', 'up', 'Partners', 'Units delivered ÷ units ordered from suppliers'],
      ['Gross margin return on inventory', 'x', 'up', 'Profit', 'Gross margin ÷ average inventory cost'],
    ],
  },
  {
    id: 'wholesale', name: 'Wholesale & distribution', group: 'Retail & commerce', kpis: [
      ['Order fill rate', '%', 'up', 'Operations', 'Lines shipped complete ÷ lines ordered'],
      ['Perfect order rate', '%', 'up', 'Quality', 'Orders on time, complete, undamaged, correctly invoiced ÷ all orders'],
      ['Days inventory outstanding', 'days', 'down', 'Cash', 'Average inventory ÷ cost of goods sold × days'],
      ['Customer order lead time', 'days', 'down', 'Customer', 'Order received to delivered'],
      ['Gross margin by account', '%', 'up', 'Profit', 'Margin per customer account'],
      ['Supplier on-time rate', '%', 'up', 'Partners', 'Supplier deliveries on time ÷ all supplier deliveries'],
      ['Warehouse cost per order', '$', 'down', 'Profit', 'Warehouse operating cost ÷ orders shipped'],
    ],
  },

  // Food & hospitality
  {
    id: 'restaurant', name: 'Restaurant & café', group: 'Food & hospitality', kpis: [
      ['Food cost percentage', '%', 'down', 'Profit', 'Cost of food sold ÷ food revenue'],
      ['Labor cost percentage', '%', 'down', 'People', 'Labor cost ÷ revenue'],
      ['Prime cost', '%', 'down', 'Profit', '(Food + beverage + labor cost) ÷ revenue'],
      ['Average check', '$', 'up', 'Growth', 'Revenue ÷ checks'],
      ['Table turnover rate', 'x', 'up', 'Operations', 'Parties seated ÷ tables per service'],
      ['Ticket time', 'min', 'down', 'Operations', 'Order to food delivered'],
      ['Food waste', '%', 'down', 'Profit', 'Food discarded ÷ food purchased'],
      ['Online order share', '%', 'up', 'Growth', 'Delivery + pickup revenue ÷ total revenue'],
      ['Review rating', 'score', 'up', 'Customer', 'Average public review score'],
    ],
  },
  {
    id: 'catering', name: 'Food truck & catering', group: 'Food & hospitality', kpis: [
      ['Revenue per event', '$', 'up', 'Growth', 'Event revenue ÷ events served'],
      ['Booking conversion', '%', 'up', 'Growth', 'Confirmed bookings ÷ inquiries'],
      ['Cost per plate', '$', 'down', 'Profit', 'Food + labor cost ÷ plates served'],
      ['Repeat client rate', '%', 'up', 'Customer', 'Returning clients ÷ all clients'],
      ['Sales per service hour', '$', 'up', 'Operations', 'Revenue ÷ hours open'],
      ['Deposit collection rate', '%', 'up', 'Cash', 'Bookings with deposit paid ÷ bookings'],
    ],
  },
  {
    id: 'hotel', name: 'Hotel & lodging', group: 'Food & hospitality', kpis: [
      ['Occupancy rate', '%', 'up', 'Growth', 'Rooms sold ÷ rooms available'],
      ['Average daily rate', '$', 'up', 'Growth', 'Room revenue ÷ rooms sold'],
      ['RevPAR', '$', 'up', 'Growth', 'Room revenue ÷ rooms available'],
      ['Direct booking share', '%', 'up', 'Profit', 'Direct bookings ÷ all bookings'],
      ['Cost per occupied room', '$', 'down', 'Profit', 'Operating cost ÷ rooms sold'],
      ['Guest satisfaction score', 'score', 'up', 'Customer', 'Average post-stay rating'],
      ['Room turnaround time', 'min', 'down', 'Operations', 'Checkout to room ready'],
    ],
  },
  {
    id: 'bar', name: 'Bar & nightlife', group: 'Food & hospitality', kpis: [
      ['Pour cost', '%', 'down', 'Profit', 'Cost of liquor poured ÷ liquor revenue'],
      ['Revenue per guest', '$', 'up', 'Growth', 'Revenue ÷ guests'],
      ['Inventory variance', '%', 'down', 'Profit', '(Expected − actual inventory) ÷ expected'],
      ['Event night revenue lift', '%', 'up', 'Growth', 'Event-night revenue ÷ average night revenue − 1'],
      ['Staff cost per shift', '$', 'down', 'People', 'Labor cost ÷ shifts'],
    ],
  },

  // Logistics & transport
  {
    id: '3pl', name: '3PL & warehousing', group: 'Logistics & transport', kpis: [
      ['Order accuracy', '%', 'up', 'Quality', 'Orders shipped without error ÷ orders shipped'],
      ['Dock-to-stock time', 'hrs', 'down', 'Operations', 'Receipt at dock to available for picking'],
      ['Pick rate', '#', 'up', 'People', 'Lines picked per labor hour'],
      ['Warehouse utilization', '%', 'up', 'Operations', 'Occupied storage ÷ usable storage'],
      ['Same-day ship rate', '%', 'up', 'Customer', 'Orders shipped same day ÷ orders received by cutoff'],
      ['Cost per order fulfilled', '$', 'down', 'Profit', 'Fulfillment cost ÷ orders'],
      ['Inventory accuracy', '%', 'up', 'Quality', 'Locations matching system count ÷ locations counted'],
      ['Client SLA compliance', '%', 'up', 'Partners', 'SLA targets met ÷ SLA targets measured'],
    ],
  },
  {
    id: 'trucking', name: 'Trucking & freight', group: 'Logistics & transport', kpis: [
      ['Revenue per mile', '$', 'up', 'Growth', 'Freight revenue ÷ loaded miles'],
      ['Cost per mile', '$', 'down', 'Profit', 'Operating cost ÷ total miles'],
      ['Deadhead percentage', '%', 'down', 'Operations', 'Empty miles ÷ total miles'],
      ['On-time pickup and delivery', '%', 'up', 'Customer', 'Stops on time ÷ all stops'],
      ['Fuel efficiency', '#', 'up', 'Profit', 'Miles per gallon'],
      ['Truck utilization', '%', 'up', 'Operations', 'Hours in revenue service ÷ available hours'],
      ['Driver turnover', '%', 'down', 'People', 'Drivers leaving ÷ average driver count'],
      ['Claims ratio', '%', 'down', 'Quality', 'Cargo claims value ÷ freight revenue'],
    ],
  },
  {
    id: 'last-mile', name: 'Last-mile & courier', group: 'Logistics & transport', kpis: [
      ['First-attempt delivery rate', '%', 'up', 'Customer', 'Delivered on first attempt ÷ delivery attempts'],
      ['Stops per route hour', '#', 'up', 'Operations', 'Stops completed ÷ route hours'],
      ['Cost per delivery', '$', 'down', 'Profit', 'Delivery operating cost ÷ deliveries'],
      ['Delivery window compliance', '%', 'up', 'Customer', 'Deliveries inside promised window ÷ deliveries'],
      ['Failed delivery rate', '%', 'down', 'Quality', 'Undeliverable ÷ attempted'],
      ['Proof-of-delivery capture', '%', 'up', 'Quality', 'Deliveries with POD ÷ deliveries'],
    ],
  },
  {
    id: 'freight-forwarding', name: 'Freight forwarding & import/export', group: 'Logistics & transport', kpis: [
      ['Customs clearance time', 'hrs', 'down', 'Operations', 'Arrival to release'],
      ['Door-to-door transit time', 'days', 'down', 'Customer', 'Pickup to final delivery'],
      ['Shipment visibility rate', '%', 'up', 'Partners', 'Shipments with live tracking ÷ shipments'],
      ['Demurrage and detention cost', '$', 'down', 'Profit', 'Port and container penalty fees'],
      ['Documentation error rate', '%', 'down', 'Quality', 'Shipments with document errors ÷ shipments'],
      ['Gross profit per shipment', '$', 'up', 'Profit', '(Sell rate − buy rate) per shipment'],
    ],
  },

  // Manufacturing & industrial
  {
    id: 'manufacturing', name: 'Discrete manufacturing', group: 'Manufacturing & industrial', kpis: [
      ['Overall equipment effectiveness', '%', 'up', 'Operations', 'Availability × performance × quality'],
      ['First pass yield', '%', 'up', 'Quality', 'Units right first time ÷ units started'],
      ['Scrap rate', '%', 'down', 'Quality', 'Scrapped units ÷ units produced'],
      ['Unplanned downtime', 'hrs', 'down', 'Operations', 'Hours lost to unplanned stops'],
      ['Throughput', '#', 'up', 'Operations', 'Units completed per day'],
      ['Capacity utilization', '%', 'up', 'Operations', 'Actual output ÷ maximum output'],
      ['Manufacturing cycle time', 'hrs', 'down', 'Operations', 'Order release to finished goods'],
      ['Supplier defect rate', '%', 'down', 'Partners', 'Defective parts received ÷ parts received'],
      ['Cost per unit', '$', 'down', 'Profit', 'Total production cost ÷ units'],
      ['Schedule attainment', '%', 'up', 'Operations', 'Orders completed on schedule ÷ orders scheduled'],
    ],
  },
  {
    id: 'food-production', name: 'Food & beverage production', group: 'Manufacturing & industrial', kpis: [
      ['Batch yield', '%', 'up', 'Quality', 'Sellable output ÷ ingredient input'],
      ['Changeover time', 'min', 'down', 'Operations', 'Last good unit to first good unit of next run'],
      ['Food safety audit score', 'score', 'up', 'Quality', 'Score from the latest audit'],
      ['Shelf-life at shipment', '%', 'up', 'Customer', 'Remaining shelf life ÷ total shelf life'],
      ['Distributor fill rate', '%', 'up', 'Partners', 'Cases delivered ÷ cases ordered by distributors'],
      ['Ingredient cost per case', '$', 'down', 'Profit', 'Ingredient spend ÷ cases produced'],
      ['Recall incidents', '#', 'down', 'Quality', 'Product recalls in the period'],
    ],
  },
  {
    id: 'construction', name: 'Construction & contracting', group: 'Manufacturing & industrial', kpis: [
      ['Projects on schedule', '%', 'up', 'Operations', 'Projects on or ahead of schedule ÷ active projects'],
      ['Cost variance', '%', 'down', 'Profit', '(Actual − budgeted cost) ÷ budgeted cost'],
      ['Bid win rate', '%', 'up', 'Growth', 'Bids won ÷ bids submitted'],
      ['Backlog', '$', 'up', 'Growth', 'Value of signed work not yet completed'],
      ['Change order rate', '%', 'down', 'Quality', 'Change order value ÷ contract value'],
      ['Safety incident rate', '#', 'down', 'People', 'Recordable incidents per 200,000 hours'],
      ['Equipment utilization', '%', 'up', 'Operations', 'Hours in use ÷ hours available'],
      ['Subcontractor on-time rate', '%', 'up', 'Partners', 'Subcontractor milestones on time ÷ milestones'],
    ],
  },
  {
    id: 'agriculture', name: 'Agriculture & farming', group: 'Manufacturing & industrial', kpis: [
      ['Yield per acre', '#', 'up', 'Operations', 'Harvest volume ÷ acres planted'],
      ['Cost per acre', '$', 'down', 'Profit', 'Operating cost ÷ acres'],
      ['Price realization', '%', 'up', 'Profit', 'Price received ÷ market benchmark'],
      ['Post-harvest loss', '%', 'down', 'Quality', 'Crop lost after harvest ÷ harvest'],
      ['Water use per unit', '#', 'down', 'Operations', 'Water used ÷ output'],
      ['Buyer contract coverage', '%', 'up', 'Partners', 'Output sold under contract ÷ total output'],
    ],
  },
  {
    id: 'energy', name: 'Energy & utilities', group: 'Manufacturing & industrial', kpis: [
      ['System uptime', '%', 'up', 'Operations', 'Hours available ÷ hours in period'],
      ['Outage duration per customer', 'min', 'down', 'Customer', 'Total outage minutes ÷ customers served'],
      ['Line loss', '%', 'down', 'Profit', 'Energy lost in transmission ÷ energy generated'],
      ['Cost per MWh', '$', 'down', 'Profit', 'Generation cost ÷ megawatt-hours'],
      ['Billing accuracy', '%', 'up', 'Quality', 'Bills without correction ÷ bills issued'],
      ['Maintenance backlog', 'days', 'down', 'Operations', 'Planned work outstanding ÷ crew capacity per day'],
    ],
  },

  // Professional services
  {
    id: 'consulting', name: 'Consulting', group: 'Professional services', kpis: [
      ['Billable utilization', '%', 'up', 'People', 'Billable hours ÷ available hours'],
      ['Realization rate', '%', 'up', 'Profit', 'Amount billed ÷ value of hours worked'],
      ['Average project margin', '%', 'up', 'Profit', '(Project fees − delivery cost) ÷ fees'],
      ['Proposal win rate', '%', 'up', 'Growth', 'Proposals won ÷ proposals sent'],
      ['Pipeline coverage', 'x', 'up', 'Growth', 'Weighted pipeline ÷ revenue target'],
      ['Client retention', '%', 'up', 'Customer', 'Clients renewing ÷ clients up for renewal'],
      ['Client outcome score', 'score', 'up', 'Customer', 'Share of engagement goals met'],
      ['Revenue per consultant', '$', 'up', 'People', 'Revenue ÷ consultants'],
    ],
  },
  {
    id: 'agency', name: 'Marketing & creative agency', group: 'Professional services', kpis: [
      ['Retainer revenue share', '%', 'up', 'Cash', 'Recurring retainer revenue ÷ total revenue'],
      ['Client ROI delivered', 'x', 'up', 'Customer', 'Client-attributed revenue ÷ client spend'],
      ['Project on-budget rate', '%', 'up', 'Profit', 'Projects within budget ÷ projects'],
      ['Scope creep', '%', 'down', 'Profit', 'Unbilled extra hours ÷ scoped hours'],
      ['Client churn', '%', 'down', 'Customer', 'Clients lost ÷ clients at start'],
      ['Creative turnaround time', 'days', 'down', 'Operations', 'Brief to first draft'],
      ['Billable utilization', '%', 'up', 'People', 'Billable hours ÷ available hours'],
    ],
  },
  {
    id: 'accounting', name: 'Accounting & bookkeeping', group: 'Professional services', kpis: [
      ['Revenue per client', '$', 'up', 'Growth', 'Revenue ÷ active clients'],
      ['Month-end close time', 'days', 'down', 'Operations', 'Days from period end to closed books'],
      ['Filing deadline compliance', '%', 'up', 'Quality', 'Filings on time ÷ filings due'],
      ['Advisory revenue share', '%', 'up', 'Growth', 'Advisory fees ÷ total fees'],
      ['Work-in-progress days', 'days', 'down', 'Cash', 'Unbilled WIP ÷ daily revenue'],
      ['Client retention', '%', 'up', 'Customer', 'Clients retained ÷ clients at start'],
    ],
  },
  {
    id: 'legal', name: 'Law firm', group: 'Professional services', kpis: [
      ['Billable hours per lawyer', 'hrs', 'up', 'People', 'Billable hours ÷ lawyers'],
      ['Collection rate', '%', 'up', 'Cash', 'Fees collected ÷ fees billed'],
      ['Matter profitability', '%', 'up', 'Profit', '(Fees − cost) ÷ fees per matter'],
      ['Lead-to-client conversion', '%', 'up', 'Growth', 'Retained clients ÷ consultations'],
      ['Case cycle time', 'days', 'down', 'Operations', 'Matter opened to closed'],
      ['Client satisfaction', 'score', 'up', 'Customer', 'Average survey score'],
    ],
  },
  {
    id: 'staffing', name: 'Staffing & recruiting', group: 'Professional services', kpis: [
      ['Fill rate', '%', 'up', 'Operations', 'Positions filled ÷ positions requested'],
      ['Time to fill', 'days', 'down', 'Operations', 'Job order to start date'],
      ['Gross margin per placement', '$', 'up', 'Profit', 'Bill rate − pay rate − burden'],
      ['Submittal-to-hire ratio', 'x', 'down', 'Quality', 'Candidates submitted ÷ hires'],
      ['90-day retention of placements', '%', 'up', 'Customer', 'Placements still working at 90 days ÷ placements'],
      ['Active contractors', '#', 'up', 'Growth', 'Contractors on assignment'],
    ],
  },
  {
    id: 'architecture', name: 'Architecture & engineering', group: 'Professional services', kpis: [
      ['Fee utilization', '%', 'up', 'People', 'Project hours ÷ available hours'],
      ['Project margin', '%', 'up', 'Profit', '(Fees − labor and consultants) ÷ fees'],
      ['Design revisions per project', '#', 'down', 'Quality', 'Revision rounds ÷ projects'],
      ['Backlog months', '#', 'up', 'Growth', 'Signed backlog ÷ monthly revenue'],
      ['Permit approval time', 'days', 'down', 'Operations', 'Submission to approval'],
    ],
  },

  // Technology
  {
    id: 'saas', name: 'SaaS & software', group: 'Technology', kpis: [
      ['Monthly recurring revenue', '$', 'up', 'Growth', 'Sum of monthly subscription revenue'],
      ['Net revenue retention', '%', 'up', 'Customer', '(Starting MRR + expansion − churn − contraction) ÷ starting MRR'],
      ['Logo churn', '%', 'down', 'Customer', 'Customers lost ÷ customers at start'],
      ['CAC payback period', 'days', 'down', 'Cash', 'CAC ÷ monthly gross margin per customer × 30'],
      ['Trial-to-paid conversion', '%', 'up', 'Growth', 'Paid conversions ÷ trials started'],
      ['Activation rate', '%', 'up', 'Customer', 'New users reaching the key action ÷ new users'],
      ['Burn multiple', 'x', 'down', 'Cash', 'Net burn ÷ net new ARR'],
      ['Uptime', '%', 'up', 'Quality', 'Minutes available ÷ minutes in period'],
      ['Rule of 40', '%', 'up', 'Growth', 'Revenue growth % + profit margin %'],
    ],
  },
  {
    id: 'msp', name: 'IT services & MSP', group: 'Technology', kpis: [
      ['Recurring revenue share', '%', 'up', 'Cash', 'Managed service revenue ÷ total revenue'],
      ['Ticket resolution time', 'hrs', 'down', 'Customer', 'Ticket opened to resolved'],
      ['First-contact resolution', '%', 'up', 'Quality', 'Tickets solved on first contact ÷ tickets'],
      ['Endpoints per technician', '#', 'up', 'People', 'Managed devices ÷ technicians'],
      ['SLA compliance', '%', 'up', 'Partners', 'Tickets within SLA ÷ tickets'],
      ['Revenue per endpoint', '$', 'up', 'Growth', 'Monthly revenue ÷ managed devices'],
    ],
  },
  {
    id: 'marketplace', name: 'Marketplaces & apps', group: 'Technology', kpis: [
      ['Gross merchandise value', '$', 'up', 'Growth', 'Total transaction value through the platform'],
      ['Take rate', '%', 'up', 'Profit', 'Platform revenue ÷ GMV'],
      ['Monthly active users', '#', 'up', 'Growth', 'Unique users active in 30 days'],
      ['Liquidity', '%', 'up', 'Operations', 'Listings that transact ÷ listings'],
      ['Day-30 retention', '%', 'up', 'Customer', 'Users active on day 30 ÷ users acquired'],
      ['Supply-side growth', '%', 'up', 'Partners', 'Growth in active sellers or providers'],
    ],
  },

  // Health & wellness
  {
    id: 'clinic', name: 'Medical clinic & practice', group: 'Health & wellness', kpis: [
      ['Patient visits', '#', 'up', 'Growth', 'Completed appointments'],
      ['No-show rate', '%', 'down', 'Operations', 'Missed appointments ÷ scheduled'],
      ['Days to next available appointment', 'days', 'down', 'Customer', 'Wait for the next open slot'],
      ['Clean claim rate', '%', 'up', 'Cash', 'Claims paid on first submission ÷ claims'],
      ['Days in accounts receivable', 'days', 'down', 'Cash', 'AR ÷ average daily charges'],
      ['Provider utilization', '%', 'up', 'People', 'Booked provider hours ÷ available hours'],
      ['Patient satisfaction', 'score', 'up', 'Customer', 'Average survey score'],
      ['Referral lab turnaround', 'hrs', 'down', 'Partners', 'Sample sent to result received'],
    ],
  },
  {
    id: 'dental', name: 'Dental practice', group: 'Health & wellness', kpis: [
      ['Production per hour', '$', 'up', 'Growth', 'Treatment value ÷ chair hours'],
      ['Case acceptance rate', '%', 'up', 'Growth', 'Treatment accepted ÷ treatment presented'],
      ['Hygiene reappointment rate', '%', 'up', 'Customer', 'Patients rebooked ÷ hygiene patients'],
      ['New patients per month', '#', 'up', 'Growth', 'First visits'],
      ['Collection rate', '%', 'up', 'Cash', 'Collected ÷ produced'],
      ['Chair utilization', '%', 'up', 'Operations', 'Booked chair time ÷ available chair time'],
    ],
  },
  {
    id: 'pharmacy', name: 'Pharmacy', group: 'Health & wellness', kpis: [
      ['Prescriptions filled', '#', 'up', 'Growth', 'Scripts dispensed'],
      ['Fill time', 'min', 'down', 'Customer', 'Script received to ready'],
      ['Dispensing error rate', '%', 'down', 'Quality', 'Errors ÷ scripts'],
      ['Generic dispensing rate', '%', 'up', 'Profit', 'Generic scripts ÷ scripts'],
      ['Inventory turns', 'x', 'up', 'Operations', 'COGS ÷ average inventory'],
      ['Wholesaler fill rate', '%', 'up', 'Partners', 'Items received ÷ items ordered'],
    ],
  },
  {
    id: 'fitness', name: 'Fitness & gym', group: 'Health & wellness', kpis: [
      ['Active members', '#', 'up', 'Growth', 'Members with a current plan'],
      ['Member churn', '%', 'down', 'Customer', 'Cancellations ÷ members at start'],
      ['Visits per member', '#', 'up', 'Customer', 'Check-ins ÷ active members'],
      ['Class fill rate', '%', 'up', 'Operations', 'Class bookings ÷ class capacity'],
      ['Ancillary revenue per member', '$', 'up', 'Growth', 'PT, retail and add-on revenue ÷ members'],
      ['Lead-to-member conversion', '%', 'up', 'Growth', 'New members ÷ leads'],
    ],
  },
  {
    id: 'salon', name: 'Salon & spa', group: 'Health & wellness', kpis: [
      ['Revenue per stylist hour', '$', 'up', 'People', 'Service revenue ÷ stylist hours'],
      ['Rebooking rate', '%', 'up', 'Customer', 'Clients who book again before leaving ÷ clients'],
      ['Retail attachment rate', '%', 'up', 'Growth', 'Tickets with product sales ÷ tickets'],
      ['Chair occupancy', '%', 'up', 'Operations', 'Booked hours ÷ available hours'],
      ['New client retention', '%', 'up', 'Customer', 'New clients returning within 90 days ÷ new clients'],
      ['Average ticket', '$', 'up', 'Growth', 'Revenue ÷ tickets'],
    ],
  },
  {
    id: 'home-health', name: 'Home health & senior care', group: 'Health & wellness', kpis: [
      ['Visit completion rate', '%', 'up', 'Operations', 'Visits completed ÷ visits scheduled'],
      ['Caregiver turnover', '%', 'down', 'People', 'Caregivers leaving ÷ average caregivers'],
      ['Hours per client per week', 'hrs', 'up', 'Growth', 'Billed hours ÷ clients ÷ weeks'],
      ['Hospital readmission rate', '%', 'down', 'Quality', 'Clients readmitted within 30 days ÷ discharges'],
      ['Referral source conversion', '%', 'up', 'Partners', 'Admissions ÷ referrals received'],
    ],
  },

  // Home & local services
  {
    id: 'trades', name: 'HVAC, plumbing & electrical', group: 'Home & local services', kpis: [
      ['Average ticket', '$', 'up', 'Growth', 'Revenue ÷ jobs'],
      ['First-time fix rate', '%', 'up', 'Quality', 'Jobs fixed on first visit ÷ jobs'],
      ['Technician utilization', '%', 'up', 'People', 'Billable hours ÷ paid hours'],
      ['Call booking rate', '%', 'up', 'Growth', 'Booked jobs ÷ inbound calls'],
      ['Maintenance agreement members', '#', 'up', 'Cash', 'Active service agreements'],
      ['Callback rate', '%', 'down', 'Quality', 'Return visits for the same issue ÷ jobs'],
      ['Supplier parts availability', '%', 'up', 'Partners', 'Parts in stock at supplier when needed ÷ requests'],
    ],
  },
  {
    id: 'cleaning', name: 'Cleaning & janitorial', group: 'Home & local services', kpis: [
      ['Revenue per labor hour', '$', 'up', 'People', 'Revenue ÷ labor hours'],
      ['Contract renewal rate', '%', 'up', 'Customer', 'Contracts renewed ÷ contracts up for renewal'],
      ['Quality inspection score', 'score', 'up', 'Quality', 'Average site inspection score'],
      ['Supply cost per job', '$', 'down', 'Profit', 'Supplies ÷ jobs'],
      ['Staff turnover', '%', 'down', 'People', 'Leavers ÷ average staff'],
    ],
  },
  {
    id: 'landscaping', name: 'Landscaping & outdoor', group: 'Home & local services', kpis: [
      ['Revenue per crew day', '$', 'up', 'Operations', 'Revenue ÷ crew days'],
      ['Route density', '#', 'up', 'Operations', 'Properties per route hour'],
      ['Upsell rate', '%', 'up', 'Growth', 'Clients buying add-ons ÷ clients'],
      ['Seasonal contract renewal', '%', 'up', 'Customer', 'Contracts renewed ÷ contracts'],
      ['Equipment downtime', 'hrs', 'down', 'Operations', 'Hours equipment unavailable'],
    ],
  },
  {
    id: 'auto', name: 'Auto repair & dealership', group: 'Home & local services', kpis: [
      ['Effective labor rate', '$', 'up', 'Profit', 'Labor revenue ÷ hours sold'],
      ['Bay utilization', '%', 'up', 'Operations', 'Bay hours used ÷ bay hours available'],
      ['Comeback rate', '%', 'down', 'Quality', 'Repeat repairs ÷ repair orders'],
      ['Parts gross margin', '%', 'up', 'Profit', '(Parts revenue − parts cost) ÷ parts revenue'],
      ['Days to turn inventory', 'days', 'down', 'Cash', 'Days a vehicle sits before sale'],
      ['Service retention', '%', 'up', 'Customer', 'Customers returning for service ÷ customers'],
    ],
  },

  // Real estate & finance
  {
    id: 'property-management', name: 'Property management', group: 'Real estate & finance', kpis: [
      ['Occupancy rate', '%', 'up', 'Growth', 'Occupied units ÷ total units'],
      ['Rent collection rate', '%', 'up', 'Cash', 'Rent collected ÷ rent due'],
      ['Average days vacant', 'days', 'down', 'Operations', 'Days between tenants'],
      ['Maintenance response time', 'hrs', 'down', 'Customer', 'Request to first response'],
      ['Tenant retention', '%', 'up', 'Customer', 'Leases renewed ÷ leases expiring'],
      ['Net operating income margin', '%', 'up', 'Profit', 'NOI ÷ gross rent'],
      ['Vendor work-order completion', '%', 'up', 'Partners', 'Vendor jobs closed on time ÷ jobs'],
    ],
  },
  {
    id: 'brokerage', name: 'Real estate brokerage', group: 'Real estate & finance', kpis: [
      ['Closed transactions', '#', 'up', 'Growth', 'Deals closed'],
      ['Gross commission income', '$', 'up', 'Growth', 'Total commission earned'],
      ['List-to-sale price ratio', '%', 'up', 'Customer', 'Sale price ÷ list price'],
      ['Days on market', 'days', 'down', 'Operations', 'Listing to contract'],
      ['Lead conversion rate', '%', 'up', 'Growth', 'Clients ÷ leads'],
      ['Agent retention', '%', 'up', 'People', 'Agents retained ÷ agents'],
    ],
  },
  {
    id: 'insurance', name: 'Insurance agency', group: 'Real estate & finance', kpis: [
      ['Written premium', '$', 'up', 'Growth', 'Premium on new and renewed policies'],
      ['Policy retention', '%', 'up', 'Customer', 'Policies renewed ÷ policies up for renewal'],
      ['Policies per household', '#', 'up', 'Growth', 'Policies ÷ households'],
      ['Quote-to-bind rate', '%', 'up', 'Growth', 'Policies bound ÷ quotes'],
      ['Loss ratio', '%', 'down', 'Profit', 'Claims paid ÷ premium earned'],
      ['Carrier appointment count', '#', 'up', 'Partners', 'Carriers you can place business with'],
    ],
  },
  {
    id: 'lending', name: 'Banking & lending', group: 'Real estate & finance', kpis: [
      ['Net interest margin', '%', 'up', 'Profit', '(Interest income − interest expense) ÷ earning assets'],
      ['Loan-to-deposit ratio', '%', 'up', 'Cash', 'Loans ÷ deposits'],
      ['Delinquency rate', '%', 'down', 'Quality', 'Loans 30+ days past due ÷ loans'],
      ['Efficiency ratio', '%', 'down', 'Profit', 'Non-interest expense ÷ revenue'],
      ['Application approval time', 'days', 'down', 'Customer', 'Application to decision'],
      ['Deposit growth', '%', 'up', 'Growth', 'Change in deposits ÷ prior deposits'],
    ],
  },

  // Education & community
  {
    id: 'education', name: 'Schools, training & tutoring', group: 'Education & community', kpis: [
      ['Enrollment', '#', 'up', 'Growth', 'Active students'],
      ['Completion rate', '%', 'up', 'Quality', 'Students completing ÷ students enrolled'],
      ['Student retention', '%', 'up', 'Customer', 'Students continuing ÷ eligible students'],
      ['Revenue per student', '$', 'up', 'Growth', 'Tuition revenue ÷ students'],
      ['Instructor utilization', '%', 'up', 'People', 'Teaching hours ÷ available hours'],
      ['Outcome attainment', '%', 'up', 'Customer', 'Students reaching the target outcome ÷ students'],
    ],
  },
  {
    id: 'childcare', name: 'Childcare', group: 'Education & community', kpis: [
      ['Enrollment vs capacity', '%', 'up', 'Growth', 'Enrolled children ÷ licensed capacity'],
      ['Waitlist length', '#', 'up', 'Growth', 'Families waiting'],
      ['Staff-to-child ratio compliance', '%', 'up', 'Quality', 'Hours in ratio ÷ hours open'],
      ['Tuition collection rate', '%', 'up', 'Cash', 'Tuition collected ÷ billed'],
      ['Family retention', '%', 'up', 'Customer', 'Families re-enrolling ÷ eligible families'],
    ],
  },
  {
    id: 'nonprofit', name: 'Nonprofit', group: 'Education & community', kpis: [
      ['Donor retention', '%', 'up', 'Customer', 'Donors giving again ÷ prior donors'],
      ['Cost to raise a dollar', '$', 'down', 'Profit', 'Fundraising cost ÷ funds raised'],
      ['Program expense ratio', '%', 'up', 'Operations', 'Program spend ÷ total spend'],
      ['People served', '#', 'up', 'Growth', 'Beneficiaries reached'],
      ['Grant win rate', '%', 'up', 'Growth', 'Grants awarded ÷ grants applied'],
      ['Volunteer hours', 'hrs', 'up', 'People', 'Hours contributed by volunteers'],
      ['Partner referral rate', '%', 'up', 'Partners', 'Clients referred by partner organizations ÷ clients'],
    ],
  },

  // Media & entertainment
  {
    id: 'events', name: 'Events & venues', group: 'Media & entertainment', kpis: [
      ['Ticket sell-through', '%', 'up', 'Growth', 'Tickets sold ÷ capacity'],
      ['Revenue per attendee', '$', 'up', 'Growth', 'Total event revenue ÷ attendees'],
      ['Sponsorship revenue', '$', 'up', 'Partners', 'Sponsor fees in the period'],
      ['Venue booking rate', '%', 'up', 'Operations', 'Days booked ÷ days available'],
      ['Attendee satisfaction', 'score', 'up', 'Customer', 'Post-event survey score'],
      ['Cost per attendee', '$', 'down', 'Profit', 'Event cost ÷ attendees'],
    ],
  },
  {
    id: 'media', name: 'Media & content creators', group: 'Media & entertainment', kpis: [
      ['Audience growth', '%', 'up', 'Growth', 'Change in followers or subscribers'],
      ['Engagement rate', '%', 'up', 'Customer', 'Interactions ÷ impressions'],
      ['Revenue per thousand views', '$', 'up', 'Profit', 'Revenue ÷ views × 1,000'],
      ['Paid subscriber conversion', '%', 'up', 'Growth', 'Paid subscribers ÷ free audience'],
      ['Brand deal revenue', '$', 'up', 'Partners', 'Sponsorship and partnership income'],
      ['Content output', '#', 'up', 'Operations', 'Pieces published per week'],
    ],
  },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const INDUSTRIES: Industry[] = RAW.map((ind) => ({
  id: ind.id,
  name: ind.name,
  group: ind.group,
  kpis: ind.kpis.map(([name, unit, direction, category, formula]) => ({
    id: `${ind.id}.${slug(name)}`,
    name, unit, direction, category, formula,
    industryId: ind.id,
  })),
}));

export const INDUSTRY_GROUPS: IndustryGroup[] = Array.from(new Set(INDUSTRIES.map((i) => i.group)));

export const ALL_INDUSTRY_KPIS: IndustryKpi[] = INDUSTRIES.flatMap((i) => i.kpis);

export function getIndustry(id: string | undefined | null): Industry | undefined {
  return INDUSTRIES.find((i) => i.id === id);
}

/** KPIs for an industry plus the universal set (deduplicated by name). */
export function kpisForIndustry(id: string | undefined | null): IndustryKpi[] {
  const own = getIndustry(id)?.kpis ?? [];
  const universal = getIndustry('universal')!.kpis;
  const seen = new Set(own.map((k) => k.name.toLowerCase()));
  return [...own, ...universal.filter((k) => !seen.has(k.name.toLowerCase()))];
}

export function formatKpiUnit(unit: KpiUnit): string {
  switch (unit) {
    case '%': return 'percent';
    case '$': return 'dollars';
    case '#': return 'count';
    case 'days': return 'days';
    case 'hrs': return 'hours';
    case 'min': return 'minutes';
    case 'x': return 'ratio';
    case 'score': return 'score';
  }
}
