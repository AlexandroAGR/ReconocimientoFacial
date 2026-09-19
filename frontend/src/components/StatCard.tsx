interface StatCardProps {
title: string;
value: string;
description: string;
icon: string;
}

export default function StatCard({
title,
value,
description,
icon,
}: StatCardProps) {
return ( <div className="stat-card"> <div className="stat-header"> <span>{title}</span>

    <div className="stat-icon">
      {icon}
    </div>
  </div>

  <strong className="stat-value">
    {value}
  </strong>

  <span className="stat-description">
    {description}
  </span>
</div>
);
}
