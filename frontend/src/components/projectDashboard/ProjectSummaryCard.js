import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

const toneToColor = {
  positive: '#0F7B6C',
  negative: '#B42318',
  neutral: '#475467',
  info: '#034AD8',
};

const ProjectSummaryCard = ({
  title,
  icon,
  primaryValue,
  subtitle,
  trendLabel,
  tone = 'info',
  actionLabel,
  onAction,
  children,
  minHeight = 220,
}) => (
  <Card
    variant="outlined"
    sx={{
      borderRadius: 3,
      borderColor: '#B7C0D0',
      minHeight,
      position: 'relative',
      overflow: 'visible',
      backgroundColor: '#FFFFFF',
    }}
  >
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        top: -1,
        left: 24,
        width: 108,
        height: 16,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        backgroundColor: toneToColor[tone] || toneToColor.info,
      }}
    />
    <CardContent sx={{ p: 3.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {icon}
            <Typography variant="h6" component="h2" fontWeight={700}>
              {title}
            </Typography>
          </Stack>
          <Typography variant="h3" component="p" fontWeight={800} lineHeight={1}>
            {primaryValue}
          </Typography>
          {subtitle && (
            <Typography color="text.secondary">
              {subtitle}
            </Typography>
          )}
          {trendLabel && (
            <Chip
              label={trendLabel}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                color: toneToColor[tone] || toneToColor.info,
                backgroundColor: `${toneToColor[tone] || toneToColor.info}14`,
                fontWeight: 700,
              }}
            />
          )}
        </Stack>
        {actionLabel && onAction && (
          <Button onClick={onAction} aria-label={`${actionLabel}: ${title}`}>
            {actionLabel}
          </Button>
        )}
      </Stack>
      {children && (
        <Box sx={{ mt: 3 }}>
          {children}
        </Box>
      )}
    </CardContent>
  </Card>
);

export default ProjectSummaryCard;

