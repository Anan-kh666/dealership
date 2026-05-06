import * as React from "react";
import { cn } from "../lib/cn";

type ContainerProps<T extends React.ElementType = "div"> = {
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Container<T extends React.ElementType = "div">({
  as,
  className,
  children,
  ...rest
}: ContainerProps<T>): React.ReactElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Tag: any = as ?? "div";
  return (
    <Tag
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 md:px-6 lg:px-12",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
